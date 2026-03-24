---
paths: src/graphs/**/prompts.py, src/graphs/**/schema.py
---

# Prompting Guide

## Use gemini-prompting Skill

**Always use the `gemini-prompting` skill for prompt-related tasks**:
- Writing new prompts
- Modifying existing prompts
- Debugging/optimizing prompts

## System Prompt vs User Prompt: Role Distinction

| Prompt Type | Role | Contents |
|-------------|------|----------|
| **System Prompt** | Defines AI identity and base behavior | `<role>`, `<constraints>`, `<quality_standards>`, `<output_requirements>` |
| **User Prompt** | Context and instructions for current task | `<context>`, `<task>`, `<instructions>`, `<few_shot_example>` |

**Design Principles**:
- System prompt: Immutable rules and roles that apply to the entire session
- User prompt: Dynamic data and specific instructions that vary per request

## Pydantic Field Descriptions Are Part of User Prompt

**Field descriptions in Pydantic models passed to `with_structured_output()` are instructions sent to the LLM**.

```python
# Example: schema.py
class Question(BaseStateConfig):
    content: str = Field(
        description="The content of the question."  # ← This is also a prompt!
    )
    category: QuestionCategoryName | None = Field(
        default=None,
        description="Map this question to the most relevant category from the framework definitions"  # ← LLM follows this instruction
    )
```

**Key Considerations**:
1. Field descriptions guide the LLM's output structure
2. Instructions in prompts.py and descriptions in schema.py must be consistent
3. Include clear and specific instructions in descriptions
4. Add examples or format hints in descriptions for complex fields

## Separating Prompts for Multiple LLM Calls

When a graph contains **multiple LLM calls**, separate and optimize prompts according to each call's purpose.

```python
# prompts.py - Separated prompts for each node
# For analysis stage
ANALYSIS_SYSTEM_PROMPT = """..."""
ANALYSIS_USER_PROMPT = """..."""

# For generation stage
GENERATION_SYSTEM_PROMPT = """..."""
GENERATION_USER_PROMPT = """..."""

# For validation stage
VALIDATION_SYSTEM_PROMPT = """..."""
VALIDATION_USER_PROMPT = """..."""
```

**Considerations When Separating**:
1. Clearly distinguish the **purpose and responsibility** of each LLM call
2. **Optimize tokens** by removing unnecessary instructions
3. Provide **few-shot examples** specialized for each stage
4. Consider separating **output schemas (Pydantic models)** per stage as well

## Prompt File Structure

```
src/graphs/<graph_name>/
├── prompts.py          # SYSTEM_PROMPT, USER_PROMPT definitions
│                       # Separate prompts per stage for multiple LLM calls
└── schema.py           # Pydantic models for with_structured_output
                        # Field description = output guide instructions
```
