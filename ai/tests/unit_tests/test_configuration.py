from jd_structuring.graph import graph
from langgraph.pregel import Pregel


def test_graph_is_pregel() -> None:
    """Test that jd_structuring graph is a valid Pregel instance."""
    assert isinstance(graph, Pregel)
    assert graph.name == "JdStructuring"
