---
paths: src/graphs/**/*.py
---

# LangGraph Development Guide

## Before Development

**Always use the context7 MCP to get the latest LangGraph/LangChain documentation before implementing any graph-related features**:

```bash
# Use context7 MCP to fetch latest docs
mcp__context7__get-library-docs library: langgraph
mcp__context7__get-library-docs library: langchain
```

This ensures you're using the most current APIs and best practices.

## Creating a New Graph (Workflow)

When creating a new graph, you MUST follow the existing file structure:

1. Create directory under `src/graphs/<graph_name>/`
2. Implement required files following the pattern:
   - `state.py`: Define state schema
   - `nodes.py`: Implement node functions
   - `graph.py`: Define workflow and compile graph
   - `schema.py`: (optional) Data models
   - `prompts.py`: (optional) LLM prompts
3. Register in `langgraph.json`
4. Update package configuration in `pyproject.toml`
5. Add tests in `tests/unit_tests/<graph_name>/`

### Example State Schema (state.py)

```python
from pydantic import BaseModel

class GraphState(BaseModel):
    """Define graph state schema."""
    input: str
    output: str | None = None
    errors: list[str] = []
```

### Example Node Implementation (nodes.py)

```python
# Use absolute imports with package names from pyproject.toml
from common.utils import process_data  # Example absolute import
from your_graph_name.state import GraphState

async def process_node(state: GraphState) -> dict:
    """Process state and return updates."""
    result = process_data(state.input)
    return {"output": result}
```

### Example Graph Definition (graph.py)

```python
from langgraph.constants import END, START
from langgraph.graph.state import StateGraph

# Use absolute imports, not relative imports
from your_graph_name.state import GraphState, InputState, ConfigSchema
from your_graph_name.nodes import process_node

# Create workflow with input and config schemas
workflow = StateGraph(
    state_schema=GraphState,
    input_schema=InputState,
    context_schema=ConfigSchema
)

# Add nodes
workflow.add_node("process", process_node)

# Add edges (use START instead of set_entry_point)
workflow.add_edge(START, "process")
workflow.add_edge("process", END)

# Compile graph
graph = workflow.compile()
```

## Common Patterns

### State Updates in Nodes

```python
def my_node(state: GraphState) -> dict:
    # Always return a dict with state updates
    return {
        "field_to_update": new_value,
        "another_field": another_value
    }
```

### Conditional Edges

```python
def routing_function(state: GraphState) -> str:
    if state.get("condition"):
        return "path_a"
    return "path_b"

workflow.add_conditional_edges(
    "source_node",
    routing_function,
    {
        "path_a": "node_a",
        "path_b": "node_b"
    }
)
```

### Error Handling

```python
def safe_node(state: GraphState) -> dict:
    try:
        result = risky_operation(state["input"])
        return {"output": result}
    except Exception as e:
        return {"errors": [str(e)]}
```

## Testing Strategy

1. **Unit Tests**: Test individual nodes and utilities
2. **Integration Tests**: Test full graph workflows
3. **Use Fixtures**: Define reusable test data in `conftest.py`
4. **Mock External Services**: Mock LLM calls for deterministic testing

## Code Style

- Follow ruff configuration in `pyproject.toml`
- Use type hints for all functions
- Google-style docstrings (enforced by ruff)
- Imports organized by isort rules
- Always use absolute imports with package names from `pyproject.toml`

## Performance Considerations

- Implement caching for expensive operations
- Use async operations where possible
- Batch LLM calls when processing multiple items
- Consider token limits for LLM providers
- Implement proper retry strategies with backoff
