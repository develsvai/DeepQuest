# Project Overview

## Purpose

Deep Quest is an AI-powered Interview Coaching Service that provides personalized technical interview preparation. The service analyzes resumes and job descriptions to generate targeted interview questions and provides AI feedback on user responses.

## Project Status

Currently in **MVP Development Phase**:

- UI Foundation (Epic 1) - In Progress
- Backend Integration (Epic 2) - Pending
- AI server integration planned for later phase

## Repository Structure

This is a **monorepo** with three main sections:

### 1. `web/` - Frontend Application

- Next.js 15.4.5 full-stack application with App Router
- Primary development workspace
- Contains UI, API routes, database schema, and business logic

### 2. `ai/` - AI Server

- Python-based LangGraph server
- Handles AI processing: resume parsing, question generation, feedback generation
- Uses LangChain, OpenAI, Google GenAI

### 3. `bmad-core/` - Development Framework

- BMAD Method development framework
- Supporting development tools

### 4. `docs/` - Documentation

- Product Requirements (PRD)
- System Architecture
- Development Rules and Guidelines

## Development Approach

### UI-First Strategy

1. Build complete UI with mock data first (Epic 1)
2. Integrate backend services progressively (Epic 2)
3. Connect AI server for actual functionality

### Data Flow

```
User Browser → Next.js Frontend → tRPC Backend → Prisma → Supabase DB
                                 ↘ AI Server (Python LangGraph)
```

## Key Documentation

- **PRD**: `/docs/sharded/prd/index.md`
- **Architecture**: `/docs/sharded/architecture/index.md`
- **Development Rules**: `/docs/web/rules/index.md`
