# Suggested Development Commands

## Frontend Development (in `web/` directory)

### Daily Development

```bash
# Start development server
cd web && pnpm dev

# Run development server on specific port
cd web && pnpm dev -p 3000
```

### Code Quality Checks

```bash
cd web

# Run linting
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Format code
pnpm format

# Check formatting without changes
pnpm format:check

# Type checking
pnpm type-check

# Run all checks (type-check + lint + format:check)
pnpm check-all
```

### Testing

```bash
cd web

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run tests once (CI mode)
pnpm test:run
```

### Database Management (Prisma)

```bash
cd web

# Generate Prisma Client (after schema changes)
pnpm db:generate

# Create new migration
pnpm db:migrate

# Create migration without applying
pnpm db:migrate:create

# Apply migrations (production)
pnpm db:migrate:deploy

# Reset database (WARNING: deletes all data)
pnpm db:migrate:reset

# Open Prisma Studio (database GUI)
pnpm db:studio

# Seed database with test data
pnpm db:seed

# Validate schema
pnpm db:validate

# Format schema file
pnpm db:format
```

### Build & Deploy

```bash
cd web

# Build for production
pnpm build

# Start production server
pnpm start
```

## AI Server Development (in `ai/` directory)

### Development Server

```bash
cd ai

# Run LangGraph server (check Makefile for exact command)
uv run langgraph dev  # or equivalent command

# Run tests
uv run pytest

# Run linting
uv run lint .

# Run type checking
uv run mypy .
```

## System Utilities (macOS Darwin)

### Common Commands

```bash
# List files
ls -la

# Find files
find . -name "*.tsx"

# Search content (prefer Serena MCP search_for_pattern tool)
grep -r "pattern" .

# Git operations
git status
git add .
git commit -m "message"
git push
```

## Package Management

### IMPORTANT: Use pnpm, NOT npm or yarn

```bash
cd web

# Install dependencies
pnpm install

# Add package
pnpm add <package-name>

# Add dev dependency
pnpm add -D <package-name>

# Remove package
pnpm remove <package-name>

# Update packages
pnpm update
```

## Quick Start Workflow

```bash
# 1. Install dependencies (first time)
cd web && pnpm install

# 2. Set up database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 3. Start development
pnpm dev

# 4. In another terminal, run checks
pnpm check-all
```
