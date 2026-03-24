# Deep Quest AI Server - Project Overview

## Purpose
Deep Quest AI Server is a LangGraph-based backend service that provides AI-powered interview preparation functionality. It handles:
- Resume parsing and structuring
- Job description text extraction and analysis
- Interview question generation
- Question feedback generation

## Architecture

### LangGraph Workflow Structure
The service consists of multiple specialized graphs (workflows), each registered in `langgraph.json`:

1. **`resume_parser`** - Parses and structures resume data with importance evaluation
2. **`jd_to_text`** - Extracts text content from job descriptions
3. **`jd_structuring`** - Structures job description data
4. **`question_gen`** - Generates interview questions
5. **`question_feedback_gen`** - Generates feedback for interview answers

### Directory Structure
```
ai/
├── src/
│   ├── common/          # Shared utilities, schemas, and state models
│   ├── graphs/          # Individual workflow graphs
│   │   ├── jd_structuring/
│   │   ├── jd_to_text/
│   │   ├── question_gen/
│   │   ├── question_feedback_gen/
│   │   └── resume_parser/
│   └── utils/           # Helper utilities
├── tests/
│   ├── unit_tests/      # Unit tests
│   └── integration_tests/  # Integration tests
├── docs/               # Additional documentation
├── langgraph.json      # LangGraph configuration
├── pyproject.toml      # Python project configuration
└── Makefile           # Development commands
```

## Graph Components Pattern
Each graph module follows this consistent structure:
- `graph.py` - Graph definition and workflow compilation
- `nodes.py` - Node implementations (processing functions)
- `state.py` - State schema definitions (input and graph state)
- `schema.py` - Data schemas and models (optional)
- `prompts.py` - LLM prompts (optional)
- `configuration.py` - Graph-specific configuration (optional)

## Package Configuration
Graphs are configured as Python packages in `pyproject.toml`:
- Package names: `resume_parser`, `jd_to_text`, `jd_structuring`, `question_gen`, `question_feedback_gen`
- Shared packages: `common`, `utils`
- Use absolute imports with these package names (not relative imports)

## Environment Requirements
Required API keys in `.env`:
- `OPENAI_API_KEY` - OpenAI models
- `ANTHROPIC_API_KEY` - Anthropic models
- `GOOGLE_API_KEY` - Google GenAI models
- `LANGSMITH_API_KEY` - LangSmith tracing (optional)
- `LANGSMITH_TRACING` - Enable tracing (optional)
