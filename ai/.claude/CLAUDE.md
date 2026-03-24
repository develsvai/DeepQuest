# Deep Quest AI Server

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Deep Quest AI Server - A LangGraph-based backend service that provides AI-powered interview preparation functionality including resume parsing, job description analysis, and interview question generation.

## Architecture

### LangGraph Workflow Structure

The service consists of multiple specialized graphs (workflows):

- **`resume_parser`**: Parses and structures resume data (`src/graphs/resume_parser/`)
- **`jd_to_text`**: Extracts text content from job descriptions (`src/graphs/jd_to_text/`)
- **`jd_structuring`**: Structures job description data (`src/graphs/jd_structuring/`)
- **`question_gen`**: Generates interview questions (`src/graphs/question_gen/`)
- **`question_feedback_gen`**: Generates feedback for interview question answers (`src/graphs/question_feedback_gen/`)

### Directory Structure

```
ai/
├── src/
│   ├── common/          # Shared utilities and constants
│   ├── graphs/          # Individual workflow graphs
│   │   ├── jd_structuring/
│   │   ├── jd_to_text/
│   │   ├── question_feedback_gen/
│   │   ├── question_gen/
│   │   └── resume_parser/
│   └── utils/           # Helper utilities
├── tests/
│   ├── unit_tests/      # Unit tests
│   └── integration_tests/  # Integration tests
└── docs/               # Additional documentation
```

### Graph Components Pattern

Each graph module MUST follow this consistent structure:
- `graph.py`: Graph definition and workflow
- `nodes.py`: Node implementations
- `state.py`: State schema definitions
- `schema.py`: Data schemas and models (optional)
- `prompts.py`: LLM prompts (optional)
- `configuration.py`: Graph-specific configuration (optional)
- `helpers.py`: Helper functions for complex graphs (optional)
- `convert.py`: Data conversion utilities (optional)

## Technology Stack

### Core Dependencies
- **LangGraph**: v1.0.4+ - Workflow orchestration
- **LangChain**: v1.1.0+ - LLM integrations
- **LangSmith**: Optional tracing and monitoring
- **Python**: 3.11+ required

### LLM Providers
- LangChain OpenAI
- LangChain Google GenAI
- LangChain Anthropic
- LangChain Community models

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# LLM API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Optional: LangSmith tracing
LANGSMITH_API_KEY=lsv2-...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=deep-quest-ai

# Model configuration
DEFAULT_MODEL=gpt-4o-mini
```

### LangGraph Configuration

Graphs are registered in `langgraph.json`:
- Each graph must be exported from its module
- Export name convention: `graph` (preferred) or `workflow`
- Specify Python path: `module.path:object_name`
- Currently registered: `resume_parser`, `jd_to_text`, `jd_structuring`, `question_gen`, `question_feedback_gen`
