# LangGraph Structure Patterns & Best Practices

## Graph Creation Pattern

### 1. State Definition (`state.py`)

Define two state classes:

```python
from pydantic import Field
from common.state_model import BaseState, BaseStateConfig

class InputState(BaseStateConfig):
    """Input parameters for the graph."""
    input_field: str = Field(description="Input description")

class GraphState(InputState, BaseState):
    """Graph state with processing fields."""
    output_field: OutputType | None = Field(None, description="Output description")
```

**Key points:**
- `InputState` extends `BaseStateConfig` (provides camelCase alias support)
- `GraphState` extends both `InputState` and `BaseState` (adds error handling + retry logic)
- `BaseState` provides: `error_code`, `error_message`, `retry_count`

### 2. Node Implementation (`nodes.py`)

```python
from typing import Any
from langchain_core.runnables import RunnableConfig
from my_graph.state import GraphState

def my_node(state: GraphState, config: RunnableConfig) -> dict[str, Any]:
    """Process state and return updates."""
    # Process state
    result = process_data(state.input_field)
    
    # Return only updated fields (not full state)
    return {
        "output_field": result,
        "retry_count": state.retry_count + 1
    }
```

**Key points:**
- Nodes take `state` and `config` parameters
- Return `dict[str, Any]` with state updates (not full state object)
- Use absolute imports from package names

### 3. Configuration (`configuration.py`)

```python
from dataclasses import dataclass, field, fields
from typing import Annotated, Type, TypeVar
from langchain_core.runnables import RunnableConfig, ensure_config
from langgraph.config import get_config

@dataclass(kw_only=True)
class ConfigSchema:
    """Configuration for the graph."""
    
    model_name: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = field(
        default="google_genai:gemini-2.5-pro",
        metadata={"description": "The LLM model to use"}
    )
    
    temperature: float = field(
        default=0.2,
        metadata={"description": "Temperature for LLM"}
    )
    
    @classmethod
    def from_runnable_config(cls: Type[T], config: RunnableConfig | None = None) -> T:
        """Create instance from RunnableConfig."""
        try:
            config = get_config()
        except RuntimeError:
            config = None
        config = ensure_config(config)
        configurable = config.get("configurable") or {}
        _fields = {f.name for f in fields(cls) if f.init}
        return cls(**{k: v for k, v in configurable.items() if k in _fields})

T = TypeVar("T", bound=ConfigSchema)
```

### 4. Graph Definition (`graph.py`)

```python
from langgraph.graph import StateGraph, START, END
from my_graph.state import GraphState, InputState
from my_graph.nodes import node1, node2
from my_graph.configuration import ConfigSchema

# Create workflow with input state and config
workflow = StateGraph(
    GraphState, 
    input=InputState, 
    config_schema=ConfigSchema
)

# Add nodes
workflow.add_node("node1", node1)
workflow.add_node("node2", node2)

# Add edges
workflow.add_edge(START, "node1")
workflow.add_edge("node1", "node2")
workflow.add_edge("node2", END)

# Or conditional edges
def route_function(state: GraphState) -> str:
    if state.some_condition:
        return "path_a"
    return "path_b"

workflow.add_conditional_edges(
    "node1",
    route_function,
    {
        "path_a": "node2",
        "path_b": END
    }
)

# Compile graph
graph = workflow.compile()
graph.name = "MyGraph"
```

### 5. Registration (`langgraph.json`)

```json
{
  "graphs": {
    "my_graph": "./src/graphs/my_graph/graph.py:graph"
  }
}
```

### 6. Package Configuration (`pyproject.toml`)

```toml
[tool.setuptools]
packages = ["my_graph"]

[tool.setuptools.package-dir]
"my_graph" = "src/graphs/my_graph"
```

## Retry Logic Pattern

Standard retry pattern using conditional edges:

```python
def should_retry_or_end(state: GraphState) -> str:
    """Determine if we should retry or end."""
    if state.output_field:  # Success
        return "next"
    
    if state.retry_count >= 3:  # Max retries
        state.error_code = "PROCESSING_FAILED"
        state.error_message = "Failed after multiple attempts"
        return END
    
    # Retry
    state.retry_count += 1
    return "retry"

workflow.add_conditional_edges(
    "processing_node",
    should_retry_or_end,
    {
        "retry": "processing_node",
        "next": "next_node",
        END: END
    }
)
```

## LLM Call Pattern

### Standard LLM invocation:

```python
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage

def llm_node(state: GraphState, config: RunnableConfig) -> dict[str, Any]:
    """Call LLM with structured output."""
    # Get configuration
    configuration = ConfigSchema.from_runnable_config(config)
    
    # Initialize model
    model = init_chat_model(
        model=configuration.model_name,
        temperature=configuration.temperature,
        max_retries=3
    )
    
    # Create messages
    messages = [
        SystemMessage(content="System prompt"),
        HumanMessage(content=f"Process: {state.input_field}")
    ]
    
    # Get structured output
    response = model.with_structured_output(OutputSchema).invoke(messages)
    
    return {"output_field": response}
```

### For multimodal (image + text):

```python
from langchain_google_genai import ChatGoogleGenerativeAI

model = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.2,
    max_retries=3
)

messages = [
    SystemMessage(content="System prompt"),
    HumanMessage(content=[
        {"type": "text", "text": "Analyze this image"},
        {"type": "image_url", "image_url": {"url": image_url}}
    ])
]

response = model.with_structured_output(Schema).invoke(messages)
```

## Error Handling Pattern

```python
def safe_node(state: GraphState, config: RunnableConfig) -> dict[str, Any]:
    """Node with error handling."""
    try:
        result = process(state.input_field)
        return {"output_field": result}
    except Exception as e:
        return {
            "error_code": "PROCESSING_ERROR",
            "error_message": str(e),
            "output_field": None
        }
```

## File Organization Checklist

Required files for each graph:
- ✅ `graph.py` - Graph definition and compilation
- ✅ `state.py` - InputState and GraphState
- ✅ `nodes.py` - Node implementations
- ⚠️ `schema.py` - Data models (optional)
- ⚠️ `prompts.py` - System prompts (optional)
- ⚠️ `configuration.py` - Config schema (optional)
- ✅ `__init__.py` - Package initialization

## Common Anti-Patterns to Avoid

❌ Returning full state object from nodes (return dict instead)
❌ Using relative imports (use absolute with package names)
❌ Modifying state in place (return updates as dict)
❌ Missing type hints on node functions
❌ Not using BaseState for error handling
❌ Forgetting to register in langgraph.json
❌ Not configuring package in pyproject.toml
