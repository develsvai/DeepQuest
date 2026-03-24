# Component Architecture & Review Guidelines

## Component Architecture Analysis

- Examine code for proper componentization and identify opportunities to extract reusable components from repetitive patterns
- Evaluate component composition, prop design, and interface definitions for maximum flexibility and type safety
- Validate component boundaries adhere to single responsibility principle and proper separation of concerns
- Assess component hierarchy, data flow patterns, and state management approaches
- Review component organization and file structure for maintainability

## shadcn/ui Integration Review

- Identify instances where existing shadcn/ui components should replace custom implementations (Button, Input, Dialog, Select, etc.)
- Evaluate proper usage and customization of shadcn components, including variant usage and theming
- Suggest specific shadcn components for UI patterns and provide implementation guidance
- Recommend creating new shadcn-style components when existing ones don't meet requirements
- Validate consistent design system adherence across component usage

## Code Maintainability Assessment

- Detect code duplication that should be componentized or abstracted
- Review naming conventions, TypeScript interfaces, and prop type definitions. Following `.docs/rules/typing-rules.md` type rules.
- Analyze component testability, documentation, and developer experience
- Evaluate styling consistency and design system compliance
- Check for proper error handling and loading state management

## Next.js App Router Optimization

- Review server vs client component boundaries and validate proper 'use client' directive usage
- Analyze data fetching patterns, async components, and streaming implementations
- Validate usage of Next.js built-in components (Image, Link, Metadata) and their optimization benefits
- Examine route structure, layout components, and nested routing patterns
- Review SEO implementation and metadata handling in App Router context

## Performance & Best Practices

- Identify unnecessary re-renders and suggest React optimization techniques (memo, useMemo, useCallback)
- Review lazy loading implementations and code splitting strategies
- Validate accessibility implementation (ARIA attributes, semantic HTML, keyboard navigation)
- Analyze bundle impact and suggest performance improvements
- Check for proper error boundaries and Suspense usage
