"""Nodes for the job description parsing graph."""

import asyncio
import os

from google import genai
from google.genai import types
from langgraph.config import get_stream_writer

from common.rate_limit import acquire_gemini_slot_async
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from jd_to_text.prompts import PARSING_JD_SYSTEM_PROMPT, PARSING_JD_USER_PROMPT
from jd_to_text.state import GraphState


def _get_genai_client() -> genai.client.Client:
    """Create and return a Google GenAI client, checking for the API key."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY environment variable not set.")
    return genai.Client(api_key=api_key)


def _get_base_generate_config(
    max_output_tokens: int = 65536, system_instruction: str = ""
) -> types.GenerateContentConfig:
    """Create and return the base configuration for content generation."""
    tools = [types.Tool(url_context=types.UrlContext())]
    return types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.1,
        tools=tools,
        max_output_tokens=max_output_tokens,
    )


async def _stream_native_generate_content(
    *,
    client: genai.client.Client,
    contents: list[types.Content],
    config: types.GenerateContentConfig,
    writer,
) -> str:
    """Bridge the sync GenAI stream into the async runtime without blocking it."""

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[str | None] = asyncio.Queue()

    def _produce() -> None:
        try:
            response = client.models.generate_content_stream(
                model="gemini-2.5-flash-lite",
                contents=contents,
                config=config,
            )
            for chunk in response:
                chunk_text = chunk.text
                if chunk_text:
                    asyncio.run_coroutine_threadsafe(queue.put(chunk_text), loop).result()
        finally:
            asyncio.run_coroutine_threadsafe(queue.put(None), loop).result()

    producer_task = asyncio.create_task(asyncio.to_thread(_produce))
    result = ""

    while True:
        chunk_text = await queue.get()
        if chunk_text is None:
            break
        writer({"type": "token", "content": chunk_text})
        result += chunk_text

    await producer_task
    return result


async def parse_jd_node(state: GraphState) -> dict:
    """Parse the job description from the URL using the new client pattern.

    Args:
        state: The current graph state containing URL and job details.

    Returns:
        Dictionary with job_description field containing the parsed text.
    """
    client = _get_genai_client()
    config = _get_base_generate_config(system_instruction=PARSING_JD_SYSTEM_PROMPT)
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text=PARSING_JD_USER_PROMPT.format(
                        url=state.url,
                        company_name=state.company_name,
                        job_title=state.job_title,
                    )
                )
            ],
        )
    ]

    writer = get_stream_writer()

    await acquire_gemini_slot_async()
    result = await _stream_native_generate_content(
        client=client,
        contents=contents,
        config=config,
        writer=writer,
    )

    return {
        "job_description": result,
    }


async def parse_jd_image_node(state: GraphState) -> dict:
    """Parse the job description from the image using LangChain.

    Note: Uses ChatGoogleGenerativeAI instead of native genai.Client
    to simplify image passing to the LLM via the image_url message format.

    Args:
        state: The current graph state containing image URL.

    Returns:
        Dictionary with job_description field containing the parsed text.
    """
    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        temperature=0.1,
        max_retries=3,
        streaming=True,
    )

    messages = [
        SystemMessage(content=PARSING_JD_SYSTEM_PROMPT),
        HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": PARSING_JD_USER_PROMPT.format(
                        url=state.url,
                        company_name=state.company_name,
                        job_title=state.job_title,
                    ),
                },
                {"type": "image_url", "image_url": {"url": state.url}},
            ]
        ),
    ]

    writer = get_stream_writer()

    await acquire_gemini_slot_async()
    result = ""
    async for chunk in model.astream(messages):
        # Stream each chunk to clients via custom stream
        chunk_text = chunk.text
        if chunk_text:  # Skip empty chunks
            writer({"type": "token", "content": chunk_text})
            result += chunk_text

    return {
        "job_description": result,
    }
