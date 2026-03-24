# Development Conventions

## Frontend Conventions

### File Naming
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Page files**: `page.tsx` (Next.js convention)

### TypeScript Standards
- **Strict mode**: Enabled
- **Type annotations**: Required for public APIs
- **Any usage**: Discouraged (ESLint warns)
- **Unused vars**: Must start with `_` if intentional

### Import Standards
- **Absolute imports**: Use `@/` prefix (e.g., `@/components/ui/button`)
- **Import organization**: Auto-sorted by ESLint

### Component Architecture
- **Page components**: Server components by default (NO "use client")
- **Client components**: Only when needed (separate from pages)
- **Component location**: 
  - Shared: `src/components/ui` (shadcn/ui)
  - Feature-specific: Route folders `_components/`

### Styling Rules
- **NO raw `<div>` tags**: Use design system components (PageContainer, Card, Button)
- **NO hardcoded colors**: Only use `designTokens.colors.*` from `/src/components/design-system/core.ts`
- **Import designTokens**: Always reference centralized design tokens

### Code Documentation
- **JSDoc**: Required for all public APIs, utilities, and components
- **Comments**: Use sparingly, code should be self-documenting

### State Management Patterns
- **Client-side global**: Zustand
- **Server state**: React Query (via tRPC)
- **Local state**: useState/useReducer
- **Forms**: react-hook-form with Zod validation

### Component Development
- **Base**: Use shadcn/ui components
- **Loading states**: Implement with skeleton loaders
- **Error handling**: User-friendly error messages
- **i18n**: Support Korean and English

## AI Server Conventions

### Python Code Style
- **Docstring Style**: Google convention
- **Line Length**: Flexible (E501 ignored)
- **Import Organization**: Enforced by ruff (isort)
- **Type Hints**: Encouraged but not mandatory

### Module Organization
- Graphs in `src/graphs/`
- Utilities in `src/utils/`
- Common code in `src/common/`

## General Best Practices
- **Componentization**: Keep files short, create reusable components
- **Search before create**: Look for existing components first
- **Generalize**: Make components reusable when possible
- **Testing**: Focus on behavior, not implementation
- **Performance**: Implement proper loading states and caching