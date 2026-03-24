# Technology Stack

## Core Framework
- **Python**: 3.13+ required (specified in pyproject.toml: `>=3.11`)
- **LangGraph**: v0.5.3+ - Workflow orchestration framework
- **LangChain**: v0.3.26+ - LLM integration and utilities
- **LangGraph CLI**: v0.3.4+ - Development server and tooling
- **LangSmith**: Optional tracing and monitoring

## LLM Providers (Actually Used)
- **LangChain OpenAI** (v0.3.28+)
- **LangChain Google GenAI** (v2.1.8+) - Primary model: gemini-2.5-pro
- **LangChain Anthropic** (v0.3.17+)
- **LangChain Community** (v0.3.27+)

## Data Validation & Serialization
- **Pydantic**: v2.11.7+ - Data validation and settings management
- **Pydantic Settings**: v2.10.1+ - Configuration management

## Development Tools
- **uv**: Package manager (all commands must be prefixed with `uv run`)
- **pytest**: v8.4.1+ - Testing framework
- **ruff**: v0.12.2+ - Fast Python linter and formatter
- **mypy**: v1.16.1+ - Static type checker (strict mode)
- **structlog**: v25.4.0+ - Structured logging

## Database & Checkpointing
- **langgraph-checkpoint-sqlite**: v2.0.10+ - Graph state persistence
- **aiosqlite**: Async SQLite operations
- **sqlalchemy**: v2.0.41+ - SQL toolkit

## HTTP & Async
- **aiohttp**: v3.12.14+ - Async HTTP client/server
- **httpx**: v0.28.1+ - Modern HTTP client
- **uvicorn**: v0.35.0+ - ASGI server

## Testing Infrastructure
- **pytest**: Main testing framework
- **anyio**: Async compatibility (asyncio backend)
- Fixture-based test organization in `tests/conftest.py`

## Build System
- **setuptools**: v80.9.0+ - Package building
- **wheel**: Package distribution format

**Actually imported and used in src/:**
- LangGraph/LangChain ecosystem
- Pydantic
- Google GenAI (primary LLM)
- structlog
