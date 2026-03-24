"""Node functions for job description structuring.

This module contains the core processing nodes for the job description
structuring workflow. It handles the interaction with AI models to
parse and structure job description text into the desired format.
"""

from typing import Any

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig

from common.rate_limit import acquire_gemini_slot_async
from common.schemas.structured_jd import StructuredJD
from jd_structuring.configuration import ConfigSchema
from jd_structuring.state import GraphState


async def jd_structuring(state: GraphState, config: RunnableConfig) -> dict[str, Any]:
    """Parse and structure a job description using an AI model.

    This function takes an unstructured job description and uses an AI model
    to extract key information and structure it according to the StructuredJD
    schema. The function handles model initialization, message formatting,
    and response processing.

    Args:
        state: The current graph state containing job description information
        config: Runtime configuration for the model and processing parameters

    Returns:
        Dictionary containing the structured job description data
    """
    configuration = ConfigSchema.from_runnable_config(config)

    # try :
    #     state = InputState.model_validate(state)
    # except ValidationError as e:
    #     raise ValueError(f"Invalid state: {e}")

    model = init_chat_model(
        model=configuration.structuring_model,
        temperature=configuration.temperature,
        max_retries=3,
    )
    model_with_structured_output = model.with_structured_output(StructuredJD)

    messages = [
        SystemMessage(content=configuration.system_prompt),
        HumanMessage(
            content=f"Please parse the following job description(**important**: the result language should be same as the given job description): \nCompany Name: {state.company_name}\nJob Title: {state.job_title}\nJob Description: {state.job_description}"
        ),
    ]

    await acquire_gemini_slot_async()
    response = await model_with_structured_output.ainvoke(messages)

    return {"structured_jd": response}
