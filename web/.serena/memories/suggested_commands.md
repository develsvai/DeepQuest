# Development Commands

## 🚀 Quick Start

```bash
# Navigate to frontend directory
cd web/

# Install dependencies (MUST use pnpm)
pnpm install

# Start development server
pnpm dev

# Open browser at http://localhost:3000
```

## 📦 Package Management (pnpm only!)

```bash
# Install all dependencies
pnpm install

# Add new dependency
pnpm add <package-name>
pnpm add -D <package-name>  # Dev dependency

# Update dependencies
pnpm update

# Check outdated packages
pnpm outdated

# Clean install
rm -rf node_modules pnpm-lock.yaml && pnpm install
```

## 🔧 Development Commands

### Core Development

```bash
# Start dev server with Turbopack (fast refresh)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking (TypeScript)
pnpm type-check
```

### Code Quality (REQUIRED before commit!)

```bash
# 🚨 CRITICAL: Run ALL checks
pnpm check-all  # Runs type-check + lint + format:check

# Individual checks
pnpm lint           # ESLint check
pnpm lint:fix       # Auto-fix ESLint issues
pnpm format         # Format with Prettier
pnpm format:check   # Check formatting
pnpm type-check     # TypeScript validation
```

## 🗄️ Database Management (Prisma)

### Common Operations

```bash
# Generate Prisma Client (after schema changes)
pnpm db:generate

# Create and apply migration
pnpm db:migrate

# Open Prisma Studio (GUI)
pnpm db:studio

# Seed database with test data
pnpm db:seed
```

### Migration Workflow

```bash
# 1. Create migration without applying
pnpm db:migrate:create

# 2. Review migration SQL in prisma/migrations/

# 3. Apply migration
pnpm db:migrate:deploy

# Reset database (CAUTION: deletes all data)
pnpm db:migrate:reset
```

### Schema Management

```bash
# Pull schema from database
pnpm db:pull

# Validate schema syntax
pnpm db:validate

# Format schema file
pnpm db:format
```

## 🎨 UI Component Management (shadcn/ui)

### Adding Components

```bash
# Add shadcn/ui component
pnpm dlx shadcn@latest add <component-name>

# Examples
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add dialog
```

### Available Components

```bash
# List all available components
pnpm dlx shadcn@latest add --help
```

## 🔍 Common Development Tasks

### Creating New Features

```bash
# 1. Create route structure
mkdir -p src/app/[locale]/(protected)/feature-name
touch src/app/[locale]/(protected)/feature-name/page.tsx

# 2. Create page-specific components
mkdir src/app/[locale]/(protected)/feature-name/_components

# 3. Add tRPC router
touch src/server/api/routers/feature.ts

# 4. Update translations
# Edit public/locales/ko/common.json
# Edit public/locales/en/common.json
```

### Working with tRPC

```bash
# After creating/modifying routers:
# 1. Restart dev server for type generation
pnpm dev

# 2. Types are auto-generated for client use
```

### File Operations

```bash
# Find files
find . -name "*.tsx" -type f
find . -path "*/node_modules" -prune -o -name "*.ts" -print

# Search in files (ignore node_modules)
grep -r "searchterm" --exclude-dir=node_modules .
grep -r "designTokens" src/

# Count lines of code
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l
```

## 🐛 Debugging & Troubleshooting

### Next.js Debugging

```bash
# Start with Node debugger
NODE_OPTIONS='--inspect' pnpm dev

# Clear Next.js cache
rm -rf .next

# Clean build
rm -rf .next && pnpm build
```

### TypeScript Issues

```bash
# Check for type errors
pnpm type-check

# Generate tsconfig paths
pnpm tsc --showConfig

# Clean TypeScript cache
rm -rf node_modules/.cache/typescript
```

### Dependency Issues

```bash
# Clear all caches
rm -rf node_modules .next pnpm-lock.yaml
pnpm install

# Check for peer dependency issues
pnpm ls --depth=0

# Deduplicate dependencies
pnpm dedupe
```

## 📊 Git Workflow

### Status and Changes

```bash
# Check status
git status

# View changes
git diff
git diff --staged  # Staged changes

# View commit history
git log --oneline -10
git log --graph --oneline
```

### Committing Changes

```bash
# Stage changes
git add .
git add -p  # Interactive staging

# Commit with message
git commit -m "feat: add interview preparation feature"

# Amend last commit
git commit --amend

# Reset changes
git reset HEAD~1  # Undo last commit (keep changes)
git reset --hard HEAD~1  # Undo last commit (discard changes)
```

### Branching

```bash
# Create and switch branch
git checkout -b feature/interview-prep

# Switch branches
git checkout main
git checkout -

# Merge branch
git merge feature/interview-prep

# Delete branch
git branch -d feature/interview-prep
```

## 🚀 Production Deployment

### Pre-deployment Checklist

```bash
# 1. Run all quality checks
pnpm check-all

# 2. Build production bundle
pnpm build

# 3. Test production build locally
pnpm start

# 4. Check bundle size
du -sh .next/

# 5. Run migrations on production
pnpm db:migrate:deploy
```

### Environment Variables

```bash
# Check required variables
cat .env.local | grep -E "^[^#]" | cut -d= -f1

# Required for production:
# DATABASE_URL
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# CLERK_SECRET_KEY
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 📝 Utility Scripts

### Project Analysis

```bash
# Count components
find src/components -name "*.tsx" | wc -l

# Find unused exports
pnpm dlx unimported

# Analyze bundle
pnpm dlx @next/bundle-analyzer

# Check for security issues
pnpm audit
```

### Performance

```bash
# Measure build time
time pnpm build

# Profile dev server startup
time pnpm dev

# Check for large files
find . -type f -size +1M -exec ls -lh {} \;
```

## ⚠️ Important Reminders

1. **ALWAYS use pnpm** - Never use npm, yarn, or bun
2. **Run `pnpm check-all`** before EVERY commit
3. **Use design tokens** - Never hardcode colors
4. **Check existing components** before creating new ones
5. **Server Components first** - Minimize "use client"
6. **Absolute imports** - Always use `@/` prefix
7. **Type safety** - No `any` types allowed
8. **Test your changes** - Manual testing required
