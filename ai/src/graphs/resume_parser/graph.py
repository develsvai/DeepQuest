"""Job description structuring graph definition.

This module defines the LangGraph workflow for parsing and structuring
job descriptions. It includes retry logic and error handling for robust
processing of job description text.
"""

from langgraph.graph import END, START, StateGraph

from resume_parser.configuration import ConfigSchema
from resume_parser.nodes import resume_parsing
from resume_parser.state import GraphState, InputState

workflow = StateGraph(GraphState, input_schema=InputState, context_schema=ConfigSchema)

NEXT = "next"


def should_retry_or_fail(state: GraphState) -> str:
    """Determine if we should retry parsing or fail."""
    # If parsing was successful, end the graph.
    if state.resume_parse_result:
        return NEXT

    # If parsing failed, check the retry count.
    if state.retry_count >= 3:
        state.error_code = "PARSING_FAILED"
        state.error_message = "Failed to parse job description after multiple attempts."
        return END

    # Otherwise, increment retry count and retry parsing.
    state.retry_count += 1
    return "resume_parsing"


workflow.add_node("resume_parsing", resume_parsing)

workflow.add_edge(START, "resume_parsing")
workflow.add_conditional_edges(
    "resume_parsing",
    should_retry_or_fail,
    {
        "resume_parsing": "resume_parsing",
        NEXT: END,
        END: END,
    },
)


graph = workflow.compile()
graph.name = "ResumeParsing"
