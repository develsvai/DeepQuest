# AI Server Technology Stack

## Runtime & Framework
- **Python**: >=3.11
- **Framework**: LangGraph v0.5.3+
- **API**: LangGraph API v0.4.0+
- **CLI**: langgraph-cli v0.3.4+

## AI & LLM Libraries
- **LangChain**: v0.3.26 (core framework)
- **LangChain Core**: v0.3.69
- **LangChain Community**: v0.3.27
- **LangGraph Checkpoint**: SQLite v2.0.10

## AI Providers
- **OpenAI**: v1.97.0 (langchain-openai v0.3.28)
- **Google GenAI**: v1.31.0 (langchain-google-genai v2.1.8)
- **Anthropic**: langchain-anthropic v0.3.17

## Development Tools
- **Linter**: ruff v0.12.2
- **Type Checker**: mypy v1.16.1
- **Testing**: pytest v8.4.1
- **Task Runner**: Makefile

## Key Graphs/Modules
Based on pyproject.toml package structure:
- `resume_parser` - Parse and analyze resumes
- `jd_to_text` - Job description text extraction
- `jd_structuring` - Structure job descriptions
- `question_gen` - Generate interview questions
- `question_feedback_gen` - Generate feedback for answers

## Code Quality Configuration
- **Ruff**: Enforces pycodestyle, pyflakes, isort, pydocstyle
- **Docstring Convention**: Google style
- **Ignored Rules**: Mandatory docstrings disabled for flexibility