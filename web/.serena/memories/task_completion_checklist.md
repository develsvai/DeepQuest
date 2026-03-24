# Task Completion Checklist

## 🎯 Before Starting Any Task

### 1. Understand Requirements

- [ ] Read the task description carefully
- [ ] Check existing code for similar patterns
- [ ] Review relevant documentation in `/docs/web/rules/`
- [ ] Identify which epic/feature area this belongs to

### 2. Check Existing Resources

- [ ] **Search for existing components** before creating new ones
- [ ] Look for reusable utilities in `/src/lib/`
- [ ] Check if similar features already exist
- [ ] Review design tokens in `/src/components/design-system/core.ts`

### 3. Plan Your Approach

- [ ] Break down complex tasks into smaller steps
- [ ] Identify Server vs Client component needs
- [ ] Plan data flow (tRPC, Prisma, Zustand)
- [ ] Consider i18n requirements

## 💻 During Development

### Code Quality Standards

- [ ] **NO raw HTML tags** - Use design system components
- [ ] **NO hardcoded colors** - Use designTokens only
- [ ] **NO `any` types** - Use proper TypeScript types
- [ ] **NO "use client" in page.tsx** - Create separate client components
- [ ] **Use absolute imports** (`@/...`) not relative paths

### Component Development

- [ ] Keep components small and focused (<200 lines)
- [ ] Extract reusable logic into hooks
- [ ] Add JSDoc comments for public APIs
- [ ] Create `*.types.ts` files for component types
- [ ] Use Server Components by default

### API Development (tRPC)

- [ ] Define Zod schemas for input validation
- [ ] Use `protectedProcedure` for auth routes
- [ ] Handle errors with proper TRPCError codes
- [ ] Add comprehensive error messages
- [ ] Test with Prisma Studio if database involved

### Database Changes

- [ ] Update `prisma/schema.prisma`
- [ ] Run `pnpm db:generate` after schema changes
- [ ] Create migration: `pnpm db:migrate dev --name descriptive-name`
- [ ] Update seed data if needed
- [ ] Test migrations locally before deploying

### Styling & UI

- [ ] Use shadcn/ui components as foundation
- [ ] Apply designTokens for all colors/spacing
- [ ] Ensure responsive design (mobile-first)
- [ ] Add loading states with skeletons
- [ ] Implement error boundaries

### Internationalization

- [ ] Add translation keys to `/public/locales/{ko,en}/`
- [ ] Use `useTranslations` hook for text
- [ ] Format dates/numbers with locale awareness
- [ ] Test both Korean and English versions

## ✅ Before Committing

### 🚨 CRITICAL: Quality Gates

```bash
# MUST run this command successfully
cd /Users/smartcow/Desktop/dev/deep-quest/web && pnpm check-all
```

This runs:

- ✅ TypeScript type checking (`pnpm type-check`)
- ✅ ESLint validation (`pnpm lint`)
- ✅ Prettier formatting check (`pnpm format:check`)

### Manual Testing

- [ ] Test feature in development mode (`pnpm dev`)
- [ ] Check both authenticated and unauthenticated states
- [ ] Verify responsive design on different screen sizes
- [ ] Test error scenarios and edge cases
- [ ] Check loading and error states

### Code Review Self-Check

- [ ] Remove all console.log statements
- [ ] Check for unused imports and variables
- [ ] Verify proper error handling
- [ ] Ensure no sensitive data in code
- [ ] Confirm following existing patterns

### Performance Checks

- [ ] No unnecessary re-renders (React DevTools)
- [ ] Proper memoization where needed
- [ ] Dynamic imports for heavy components
- [ ] Images optimized with Next.js Image
- [ ] Bundle size impact acceptable

### Documentation Updates

- [ ] Update relevant README if needed
- [ ] Add/update JSDoc comments
- [ ] Document complex business logic
- [ ] Update API documentation if changed

## 📝 Commit Guidelines

### Commit Message Format

```
<type>: <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
git commit -m "feat: add interview preparation dashboard"
git commit -m "fix: resolve authentication redirect loop"
git commit -m "refactor: extract FileUpload into reusable component"
```

## 🚀 After Task Completion

### Verification Steps

1. **Build Check**: Run `pnpm build` to ensure production build works
2. **Start Check**: Run `pnpm start` to test production server
3. **Migration Check**: Ensure database migrations are committed
4. **Dependencies**: Check no unnecessary packages were added

### Communication

- [ ] Update task status in project management tool
- [ ] Document any technical decisions made
- [ ] Note any technical debt incurred
- [ ] Share learnings with team if applicable

## ⚠️ Common Pitfalls to Avoid

### Architecture Mistakes

- ❌ Putting business logic in components
- ❌ Using client components unnecessarily
- ❌ Creating duplicate components
- ❌ Ignoring existing patterns

### Code Quality Issues

- ❌ Skipping `pnpm check-all`
- ❌ Committing with TypeScript errors
- ❌ Leaving commented-out code
- ❌ Hardcoding configuration values

### Performance Problems

- ❌ Not using Server Components
- ❌ Missing loading states
- ❌ Unnecessary client-side data fetching
- ❌ Large bundle imports

### Security Concerns

- ❌ Exposing sensitive keys in code
- ❌ Missing authentication checks
- ❌ Improper input validation
- ❌ SQL injection vulnerabilities

## 🔧 Troubleshooting Guide

### If `pnpm check-all` Fails

#### Type Errors

```bash
# See detailed errors
pnpm type-check

# Common fixes:
# - Add proper types
# - Fix import paths
# - Update type definitions
```

#### Lint Errors

```bash
# Auto-fix what's possible
pnpm lint:fix

# Manual fixes needed for:
# - any types usage
# - Missing dependencies in hooks
# - Accessibility issues
```

#### Format Errors

```bash
# Auto-format code
pnpm format

# This fixes:
# - Indentation
# - Line lengths
# - Import sorting
```

### If Build Fails

```bash
# Clear caches and rebuild
rm -rf .next node_modules/.cache
pnpm build

# Check for:
# - Missing environment variables
# - Import errors
# - Dynamic import issues
```

### If Tests Fail

```bash
# Run specific test
pnpm test path/to/test

# Debug mode
pnpm test:watch

# Update snapshots if needed
pnpm test -u
```

## 📋 Final Checklist Summary

**Before ANY commit, ensure:**

1. ✅ `pnpm check-all` passes
2. ✅ No hardcoded colors (use designTokens)
3. ✅ No raw HTML tags (use components)
4. ✅ No `any` types
5. ✅ Server Components used where possible
6. ✅ Manual testing completed
7. ✅ Responsive design verified
8. ✅ Error handling implemented
9. ✅ Loading states added
10. ✅ Translations updated (if UI text added)
