"""Define the graph for parsing job descriptions from a URL."""

from langgraph.graph import END, START, StateGraph

from jd_to_text.nodes import parse_jd_node, parse_jd_image_node
from jd_to_text.state import GraphState, InputState


def is_image_url(state: GraphState) -> bool:
    """Check if the URL ends with an image extension."""
    image_extensions = (".png", ".jpg", ".jpeg")
    return state.url.lower().endswith(image_extensions)


# Define the graph with input schema validation
workflow = StateGraph(GraphState, input_schema=InputState)

# Add the nodes
workflow.add_node("parse_jd", parse_jd_node)
workflow.add_node("parse_jd_image", parse_jd_image_node)

# Set the entrypoint
workflow.add_conditional_edges(
    START,
    is_image_url,
    {
        True: "parse_jd_image",
        False: "parse_jd",
    },
)
workflow.add_edge("parse_jd", END)
workflow.add_edge("parse_jd_image", END)

# Compile the graph
app = workflow.compile()
