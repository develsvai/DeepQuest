"""Job description structuring graph definition.

This module defines the LangGraph workflow for parsing and structuring
job descriptions. It includes retry logic and error handling for robust
processing of job description text.
"""

from langgraph.graph import END, START, StateGraph

from jd_structuring.configuration import ConfigSchema
from jd_structuring.nodes import jd_structuring
from jd_structuring.state import GraphState, InputState


def should_retry_or_fail(state: GraphState) -> str:
    """Determine if we should retry parsing or fail."""
    # If parsing was successful, end the graph.
    if state.structured_jd:
        return END

    # If parsing failed, check the retry count.
    if state.retry_count >= 3:
        state.error_code = "PARSING_FAILED"
        state.error_message = "Failed to parse job description after multiple attempts."
        return END

    # Otherwise, increment retry count and retry parsing.
    state.retry_count += 1
    return "jd_structuring"


workflow = StateGraph(GraphState, input_schema=InputState, context_schema=ConfigSchema)

workflow.add_node("jd_structuring", jd_structuring)

workflow.add_edge(START, "jd_structuring")

workflow.add_conditional_edges(
    "jd_structuring",
    should_retry_or_fail,
    {
        "jd_structuring": "jd_structuring",
        END: END,
    },
)

graph = workflow.compile()
graph.name = "JdStructuring"
