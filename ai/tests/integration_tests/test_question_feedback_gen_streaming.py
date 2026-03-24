"""Integration tests for question_feedback_gen graph streaming functionality.

This test module validates that streaming works correctly with:
- Pydantic BaseModel-based state
- with_structured_output for Feedback schema
- Different stream modes (updates, messages, values)
"""

from pathlib import Path

import pytest
from dotenv import load_dotenv
from question_feedback_gen.graph import graph

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

pytestmark = pytest.mark.anyio


@pytest.mark.langsmith
async def test_basic_invoke() -> None:
    """Test basic graph invocation to ensure it works."""
    print("\n=== Test 1: Basic Invoke ===")

    inputs = {
        "answer": "Python's core logic is implemented in the CPython interpreter, "
        "which compiles Python code to bytecode and executes it in a virtual machine. "
        "The interpreter uses a stack-based execution model with automatic memory management via reference counting and garbage collection."
    }

    # Use OpenAI model to avoid Google ADC issues
    config = {"configurable": {"structuring_model": "openai:gpt-4o-mini"}}
    result = await graph.ainvoke(inputs, config)

    print(f"\nResult feedback: {result.get('feedback')}")
    assert result is not None
    assert "feedback" in result
    assert result["feedback"] is not None
    assert result["feedback"].rating in ["DEEP", "INTERMEDIATE", "SURFACE"]
    print(f"✓ Rating: {result['feedback'].rating}")
    print(f"✓ Strengths: {len(result['feedback'].strengths)} items")
    print(f"✓ Weaknesses: {len(result['feedback'].weaknesses)} items")
    print(f"✓ Suggestions: {len(result['feedback'].suggestions)} items")


@pytest.mark.langsmith
async def test_stream_updates() -> None:
    """Test streaming with stream_mode='updates' (node completion updates)."""
    print("\n=== Test 2: Stream Updates ===")

    inputs = {
        "answer": "Python uses reference counting and garbage collection for memory management."
    }

    config = {"configurable": {"structuring_model": "openai:gpt-4o-mini"}}
    chunk_count = 0
    async for chunk in graph.astream(inputs, config=config, stream_mode="updates"):
        chunk_count += 1
        print(f"\n[Chunk {chunk_count}] {chunk}")

        # Each chunk should be a dict with node name as key
        assert isinstance(chunk, dict)

        # Check if feedback was generated
        if "question_feedback_gen" in chunk:
            node_output = chunk["question_feedback_gen"]
            if "feedback" in node_output and node_output["feedback"] is not None:
                feedback = node_output["feedback"]
                print(f"✓ Feedback received: Rating={feedback.rating}")
                assert feedback.rating in ["DEEP", "INTERMEDIATE", "SURFACE"]

    print(f"\n✓ Received {chunk_count} update chunks")
    assert chunk_count > 0


@pytest.mark.langsmith
async def test_stream_messages() -> None:
    """Test streaming with stream_mode='messages' (LLM token streaming).

    This is the key test for Pydantic + with_structured_output + streaming.
    """
    print("\n=== Test 3: Stream Messages (LLM Tokens) ===")

    inputs = {
        "answer": "In my experience with FastAPI projects, I implemented async/await patterns "
        "for database queries using SQLAlchemy 2.0. This improved response times by 40% "
        "compared to synchronous operations."
    }

    config = {"configurable": {"structuring_model": "openai:gpt-4o-mini"}}
    token_count = 0
    message_chunks = []

    async for message_chunk, metadata in graph.astream(
        inputs, config=config, stream_mode="messages"
    ):
        token_count += 1

        # Print token content if available
        if hasattr(message_chunk, "content") and message_chunk.content:
            print(message_chunk.content, end="", flush=True)
            message_chunks.append(message_chunk.content)

        # Print metadata info
        if token_count == 1:
            print(f"\n[Metadata] Node: {metadata.get('langgraph_node')}")
            print(f"[Metadata] Tags: {metadata.get('tags')}")

    print(f"\n\n✓ Received {token_count} message chunks (tokens)")
    print(f"✓ Total content length: {sum(len(c) for c in message_chunks)} characters")
    assert token_count > 0


@pytest.mark.langsmith
async def test_stream_values() -> None:
    """Test streaming with stream_mode='values' (full state after each node)."""
    print("\n=== Test 4: Stream Values (Full State) ===")

    inputs = {
        "answer": "Async programming in Python allows concurrent I/O operations without threading overhead."
    }

    config = {"configurable": {"structuring_model": "openai:gpt-4o-mini"}}
    state_count = 0
    final_state = None

    async for state in graph.astream(inputs, config=config, stream_mode="values"):
        state_count += 1
        print(f"\n[State {state_count}]")
        print(
            f"  - Has feedback: {'feedback' in state and state['feedback'] is not None}"
        )
        print(f"  - Retry count: {state.get('retry_count', 0)}")

        final_state = state

        # Check state structure
        assert isinstance(state, dict)
        assert "answer" in state

    print(f"\n✓ Received {state_count} state snapshots")
    assert state_count > 0
    assert final_state is not None

    # Final state should have feedback
    if final_state.get("feedback"):
        print(f"✓ Final feedback rating: {final_state['feedback'].rating}")


@pytest.mark.langsmith
async def test_stream_multiple_modes() -> None:
    """Test streaming with multiple modes simultaneously."""
    print("\n=== Test 5: Multiple Stream Modes ===")

    inputs = {
        "answer": "The event loop in asyncio schedules coroutines and manages I/O operations efficiently."
    }

    config = {"configurable": {"structuring_model": "openai:gpt-4o-mini"}}
    updates_count = 0
    messages_count = 0

    async for mode, chunk in graph.astream(
        inputs, config=config, stream_mode=["updates", "messages"]
    ):
        if mode == "updates":
            updates_count += 1
            print(f"\n[UPDATE] {chunk}")
        elif mode == "messages":
            messages_count += 1
            message, metadata = chunk
            if hasattr(message, "content") and message.content:
                print(message.content, end="", flush=True)

    print(f"\n\n✓ Updates: {updates_count} chunks")
    print(f"✓ Messages: {messages_count} tokens")
    assert updates_count > 0
    assert messages_count > 0


@pytest.mark.langsmith
async def test_stream_with_filtering() -> None:
    """Test filtering streamed tokens by node metadata."""
    print("\n=== Test 6: Stream with Node Filtering ===")

    inputs = {
        "answer": "Garbage collection in Python uses generational hypothesis for optimization."
    }

    config = {"configurable": {"structuring_model": "openai:gpt-4o-mini"}}
    filtered_tokens = []

    async for msg, metadata in graph.astream(
        inputs, config=config, stream_mode="messages"
    ):
        # Filter by specific node
        if metadata.get("langgraph_node") == "question_feedback_gen":
            if hasattr(msg, "content") and msg.content:
                filtered_tokens.append(msg.content)
                print(msg.content, end="", flush=True)

    print(
        f"\n\n✓ Filtered tokens from 'question_feedback_gen' node: {len(filtered_tokens)}"
    )
    assert len(filtered_tokens) > 0


if __name__ == "__main__":
    """Run tests directly for quick verification."""
    import asyncio

    async def run_all_tests():
        print("=" * 80)
        print("Running Question Feedback Gen Streaming Tests")
        print("=" * 80)

        try:
            await test_basic_invoke()
            await test_stream_updates()
            await test_stream_messages()
            await test_stream_values()
            await test_stream_multiple_modes()
            await test_stream_with_filtering()

            print("\n" + "=" * 80)
            print("✓ All tests passed!")
            print("=" * 80)
        except Exception as e:
            print(f"\n✗ Test failed: {e}")
            import traceback

            traceback.print_exc()

    asyncio.run(run_all_tests())
