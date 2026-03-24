# Next.js Component Architecture Review Report

Date: 2025-01-18 12:00
Reviewed Against:

- /docs/web/rules/view/components/architecture.md
- /docs/web/rules/view/patterns/react.md
- /docs/web/rules/view/patterns/server-client-components.md
- /docs/web/rules/view/components/composition-patterns.md
- /docs/web/rules/common/typescript/typing.md

## Summary

- Components Analyzed: 8
- Total Violations: 14
- Critical Issues: 5
- Improvement Opportunities: 9

## Path Analyzed

`web/src/app/[locale]/(protected)/interview-prep/[id]/[experienceType]/[experienceId]/[problemId]/`

## Violations by Rule Document

### Component Architecture (architecture.md)

#### VIOLATION 1: Multiple Responsibilities in Single Component

- **Rule Reference**: architecture.md - Section 2 "Single Responsibility Components" (lines 48-96)
- **File Location**: `ProblemSolvingClientWrapper.tsx:29-216`
- **Current Implementation**: Component handles session management, routing, error handling, and UI rendering
- **Required Correction**: Split into separate concerns:

  ```typescript
  // Separate hooks for logic
  const useProblemSolvingSession = (questionId, preparationId, experienceType, experienceId) => {
    // Session management logic only
  }

  // Separate error boundary component
  const ProblemSolvingErrorBoundary = ({ children, onError }) => {
    // Error handling only
  }

  // UI wrapper focuses on composition
  const ProblemSolvingClientWrapper = (props) => {
    const session = useProblemSolvingSession(props);
    return <ProblemSolvingErrorBoundary>...</ProblemSolvingErrorBoundary>
  }
  ```

- **Rationale**: Single Responsibility Principle ensures components are maintainable and testable

#### VIOLATION 2: Hardcoded Styles Instead of Design Tokens

- **Rule Reference**: architecture.md - Section 8 "안티패턴 금지사항" #2 (line 478)
- **File Location**: Multiple locations
  - `FeedbackCard.tsx:142` - hardcoded color '#22c55e'
  - `FeedbackCard.tsx:194` - hardcoded color '#f97316'
  - `FeedbackCard.tsx:242` - hardcoded color '#3b82f6'
  - `FollowUpSelectionCard.tsx:58-60` - hardcoded colors for difficulty
- **Required Correction**: Use design tokens:

  ```typescript
  // Add to design-system/core.ts
  status: {
    success: 'var(--status-success)', // green
    warning: 'var(--status-warning)', // orange
    info: 'var(--status-info)', // blue
  }

  // Use in components
  style={{ color: designTokens.colors.status.success }}
  ```

### React Patterns (react.md)

#### VIOLATION 3: Missing Custom Hook Extraction

- **Rule Reference**: react.md - Section 1 "Custom Hooks for Logic Extraction" (lines 32-56)
- **File Location**: `ProblemSolvingClientWrapper.tsx:44-114`
- **Current Implementation**: All state logic embedded in component
- **Required Correction**:

  ```typescript
  // hooks/useProblemSolvingSession.ts
  export const useProblemSolvingSession = (
    questionId: string,
    preparationId: string
  ) => {
    const [session, setSession] = useState<ProblemSolvingSession | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Extract all session logic here
    return {
      session,
      isLoading,
      error,
      handleSubmitAnswer,
      handleGenerateFollowUp,
    }
  }
  ```

#### VIOLATION 4: Missing Memoization for Expensive Operations

- **Rule Reference**: react.md - Section 2 "Proper Memoization Strategy" (lines 62-80)
- **File Location**: `FollowUpSelectionCard.tsx:57-67`
- **Current Implementation**: Helper functions recreated on every render
- **Required Correction**:

  ```typescript
  const getDifficultyColor = useCallback((difficulty: number) => {
    if (difficulty <= 2) return '#22c55e'
    if (difficulty <= 3) return '#f97316'
    return '#ef4444'
  }, [])

  const getDifficultyLabel = useCallback(
    (difficulty: number) => {
      if (difficulty <= 2) return tDifficulty('easy')
      if (difficulty <= 3) return tDifficulty('medium')
      return tDifficulty('hard')
    },
    [tDifficulty]
  )
  ```

### Server/Client Components (server-client-components.md)

#### VIOLATION 5: Unnecessary Client Component Declaration

- **Rule Reference**: server-client-components.md - "Server Component를 사용해야 하는 경우" (lines 13-48)
- **File Location**: `QuestionCard.tsx:8` - Has 'use client' but no interactivity
- **Current Implementation**: Client component for static display
- **Required Correction**: Remove 'use client' directive - component only displays data

#### VIOLATION 6: Missing Server Component Optimization

- **Rule Reference**: server-client-components.md - "컴포넌트 경계 최적화" (lines 99-144)
- **File Location**: `page.tsx:59-87`
- **Current Implementation**: Entire flow wrapped in client component
- **Required Correction**: Extract static parts to server components:

  ```typescript
  // page.tsx (Server Component)
  export default async function ProblemSolvingPage({ params }) {
    const question = await getQuestion(problemId);

    return (
      <>
        <QuestionDisplay question={question} /> {/* Server Component */}
        <ProblemSolvingClientWrapper {...props} /> {/* Client Component for interaction */}
      </>
    );
  }
  ```

### Composition Patterns (composition-patterns.md)

#### VIOLATION 7: Props Drilling Through Multiple Levels

- **Rule Reference**: composition-patterns.md - "Props 드릴링 문제" (lines 14-65)
- **File Location**: `ProblemSolvingClientWrapper.tsx` → `ProblemSolvingFeed.tsx` → child components
- **Current Implementation**: Passing 6+ props through intermediate components
- **Required Correction**: Use composition or Zustand:

  ```typescript
  // Use Zustand store for session state
  const useProblemSolvingStore = create(set => ({
    session: null,
    setSession: session => set({ session }),
    // Other session-related state
  }))

  // Components access store directly
  function FeedbackCard() {
    const { session, handleGenerateFollowUp } = useProblemSolvingStore()
    // No props needed
  }
  ```

### TypeScript Standards (typing.md)

#### VIOLATION 8: Missing Type Exports

- **Rule Reference**: typing.md - "컴포넌트 지역 타입" (lines 13-23)
- **File Location**: All component files lack `.types.ts` files
- **Required Correction**: Create type files for each component:
  ```typescript
  // ProblemSolvingClientWrapper.types.ts
  export interface ProblemSolvingClientWrapperProps {
    preparationId: string
    experienceType: ExperienceType
    experienceId: string
    questionId: string
  }
  ```

## Detailed Findings

### Critical Issue 1: Component Boundary Violations

- **Rule Reference**: server-client-components.md - lines 99-144
- **File Location**: Multiple components
- **Impact**: Increased bundle size, poor performance
- **Solution**: Restructure to maximize server components

### Critical Issue 2: State Management Anti-Pattern

- **Rule Reference**: react.md - "State Location Strategy" (lines 159-187)
- **File Location**: `ProblemSolvingClientWrapper.tsx`
- **Impact**: Complex prop passing, hard to maintain
- **Solution**: Implement Zustand for session state

### Critical Issue 3: Missing Error Boundaries

- **Rule Reference**: architecture.md - "Error Boundary Implementation" (lines 419-434)
- **File Location**: All components lack error boundaries
- **Impact**: Errors crash entire page
- **Solution**: Add error boundaries at strategic points

## Component Reusability Opportunities

### 1. Extract Reusable Loading State Component

**Pattern Identified**: Loading skeleton pattern repeated
**Files**: `ProblemSolvingClientWrapper.tsx:134-142`, `FollowUpGenerationCard.tsx`
**Recommendation**: Create generic `LoadingCard` component

### 2. Extract Feedback Section Components

**Pattern Identified**: Collapsible sections with icons
**Files**: `FeedbackCard.tsx:128-277`
**Recommendation**: Create `CollapsibleFeedbackSection` component

### 3. Extract Rating Badge Component

**Pattern Identified**: Rating display with colors
**Files**: `FeedbackCard.tsx:113-122`
**Recommendation**: Create `RatingBadge` component with proper design tokens

### 4. Extract Answer Display Component

**Pattern Identified**: User answer display repeated
**Files**: `ProblemSolvingFeed.tsx:56-93`, similar patterns elsewhere
**Recommendation**: Create `AnswerDisplay` component

## shadcn/ui Integration Opportunities

### 1. Replace Custom Collapsible Implementation

- **Current**: Custom collapsible in `FeedbackCard.tsx`
- **Available**: `Collapsible` component already imported but underutilized
- **Recommendation**: Use consistent collapsible patterns with proper animations

### 2. Add Progress Component

- **Current**: Custom progress dots in `FollowUpGenerationCard.tsx:104-126`
- **Available**: `progress.tsx` in ui folder
- **Recommendation**: Use `Progress` component for loading states

### 3. Utilize Alert Component

- **Current**: Custom error display in `ProblemSolvingClientWrapper.tsx:145-172`
- **Available**: `alert.tsx` in ui folder
- **Recommendation**: Use `Alert` for error states

### 4. Add Separator Component

- **Current**: Border-top styling for visual separation
- **Available**: `separator.tsx` in ui folder
- **Recommendation**: Use `Separator` for consistent spacing

### 5. Implement Tabs for Feedback Sections

- **Current**: Multiple collapsible sections in `FeedbackCard.tsx`
- **Available**: `tabs.tsx` in ui folder
- **Recommendation**: Consider tabs for better UX on mobile

## Performance Optimization Recommendations

### 1. Lazy Load Heavy Components

**Rule Reference**: architecture.md - "Lazy Loading Components" (lines 354-380)

```typescript
const FeedbackCard = lazy(() => import('./FeedbackCard'))
const FollowUpSelectionCard = lazy(() => import('./FollowUpSelectionCard'))
```

### 2. Implement Proper Memoization

**Rule Reference**: react.md - lines 62-80

- Memoize `ProblemSolvingFeed` component
- Add `useCallback` for all event handlers
- Use `useMemo` for computed values

### 3. Optimize Re-renders

- Split state to prevent unnecessary updates
- Use React.memo for pure display components
- Implement proper dependency arrays

## Next.js App Router Best Practices

### 1. Streaming and Suspense

**Recommendation**: Add Suspense boundaries for progressive loading:

```typescript
<Suspense fallback={<QuestionSkeleton />}>
  <QuestionCard question={question} />
</Suspense>
<Suspense fallback={<AnswerInputSkeleton />}>
  <AnswerInputCard />
</Suspense>
```

### 2. Parallel Routes

**Consideration**: For follow-up questions, consider parallel routes to preload options

### 3. Route Groups

**Current Structure**: Good use of `(protected)` route group
**Enhancement**: Consider sub-groups for problem-solving flow

## Priority Recommendations

### High Priority (Fix Immediately)

1. Remove hardcoded colors - use design tokens
2. Extract session logic to custom hook
3. Fix server/client component boundaries
4. Add proper TypeScript type definitions

### Medium Priority (Next Sprint)

1. Implement Zustand for state management
2. Add error boundaries
3. Extract reusable components
4. Integrate unused shadcn/ui components

### Low Priority (Future Enhancement)

1. Add lazy loading for heavy components
2. Implement comprehensive memoization
3. Add animation with framer-motion
4. Optimize for mobile performance

## Education Notes

### For Component Architecture

- Review architecture.md Section 2 for Single Responsibility Principle
- Study composition patterns in composition-patterns.md Section 1

### For React Patterns

- Review react.md Section 4 for State Management patterns
- Study Context vs Zustand guidelines in lines 193-304

### For Server Components

- Review server-client-components.md Section 1 for selection criteria
- Study optimization patterns in lines 99-144

### For TypeScript

- Review typing.md Section 1 for type management patterns
- Study Zod integration in Section 4 for runtime validation

## Conclusion

The problem-solving components show good structure but need optimization for:

1. **Server/Client boundaries** - Too much client-side rendering
2. **State management** - Props drilling needs Zustand solution
3. **Component reusability** - Extract common patterns
4. **Design token compliance** - Remove all hardcoded values
5. **TypeScript standards** - Add proper type definitions

Implementing these recommendations will improve performance, maintainability, and align with established architectural patterns.
