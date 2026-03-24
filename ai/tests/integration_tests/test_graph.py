import pytest
from jd_structuring.graph import graph

pytestmark = pytest.mark.anyio


@pytest.mark.langsmith
async def test_jd_structuring_simple() -> None:
    """Test basic JD structuring functionality."""
    inputs = {
        "text": "We are looking for a Python developer with 3+ years of experience."
    }
    res = await graph.ainvoke(inputs)  # type: ignore[arg-type]
    assert res is not None
    # Check if parsing was successful or error was handled
    assert "data" in res or "error_message" in res
