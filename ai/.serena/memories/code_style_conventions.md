# Code Style & Conventions

## Type Hints (MANDATORY)
- **All functions must have type hints** for parameters and return values
- Use `mypy --strict` mode - no implicit `Any` allowed
- Import types from `typing` or `collections.abc` as needed
- Example:
  ```python
  def process_node(state: GraphState, config: RunnableConfig) -> dict[str, Any]:
      """Process node with typed parameters."""
      ...
  ```

## Import Organization
- **Always use absolute imports** with package names from `pyproject.toml`
- Package names: `common`, `utils`, `resume_parser`, `jd_to_text`, `jd_structuring`, `question_gen`, `question_feedback_gen`
- **Never use relative imports** (e.g., avoid `from .state import ...`)
- Imports organized by `isort` rules (enforced by ruff)
- Example:
  ```python
  from common.schemas.structured_jd import StructuredJD
  from resume_parser.state import GraphState
  from resume_parser.nodes import process_node
  ```

## Docstrings (Google Style)
- Use Google-style docstrings (enforced by ruff pydocstyle)
- Docstrings are **optional** (D100-D107 rules disabled in ruff config)
- When writing docstrings, follow Google format:
  ```python
  def function_name(param: str) -> int:
      """Brief description.
      
      Longer description if needed.
      
      Args:
          param: Description of parameter.
          
      Returns:
          Description of return value.
      """
  ```

## Ruff Configuration
**Enabled checks:**
- `E` - pycodestyle errors
- `F` - pyflakes
- `I` - isort (import sorting)
- `D` - pydocstyle (Google convention)
- `D401` - First line should be in imperative mood
- `T201` - print statements
- `UP` - pyupgrade (modern Python syntax)

**Ignored checks:**
- `UP006`, `UP007`, `UP035` - Type annotation upgrades
- `D417` - Undocumented function parameters
- `E501` - Line too long
- `D100-D107` - Missing docstrings (optional)

**Per-file ignores:**
- `tests/*` - All docstring and pyupgrade checks
- `src/graphs/jd_to_text/*` - All ruff checks (legacy code)

## Pydantic Patterns
- Use `BaseModel` for data schemas
- Use `Field` for field descriptions and defaults
- Configure camelCase aliases via `model_config`:
  ```python
  class MyModel(BaseModel):
      model_config = ConfigDict(
          alias_generator=to_camel,
          populate_by_name=True,
      )
      
      my_field: str  # Serializes as "myField"
  ```

## State Management Pattern
- Input states extend `BaseStateConfig` (for camelCase support)
- Graph states extend `InputState` and `BaseState` (for error handling + retry logic)
- Base state includes: `error_code`, `error_message`, `retry_count`
- Example:
  ```python
  class InputState(BaseStateConfig):
      resume_file_path: str = Field(description="...")
  
  class GraphState(InputState, BaseState):
      resume_parse_result: ResumeParseResult | None = None
  ```

## Node Implementation Pattern
- Nodes receive `state` and `config` parameters
- Return dict with state updates (not full state)
- Use `RunnableConfig` for configuration
- Example:
  ```python
  def my_node(state: GraphState, config: RunnableConfig) -> dict[str, Any]:
      # Process state
      result = process(state.input)
      # Return only updated fields
      return {"output": result}
  ```

## Configuration Pattern
- Use `@dataclass(kw_only=True)` for configuration schemas
- Extend from base or define custom schema
- Use `from_runnable_config()` classmethod to extract config
- Use field metadata for descriptions
- Example in `configuration.py`

## Error Handling
- Use try-except blocks for LLM calls
- Provide fallback behavior (e.g., default values)
- Track retry count in state for retry logic
- Set error codes and messages in state

## File Naming
- Use snake_case for all Python files
- Standard filenames: `graph.py`, `nodes.py`, `state.py`, `schema.py`, `prompts.py`, `configuration.py`
- Test files: `test_*.py`
