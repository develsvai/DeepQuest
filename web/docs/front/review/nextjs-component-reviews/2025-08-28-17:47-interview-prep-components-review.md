# Next.js Component Architecture Review Report

Date: 2025-08-28 17:47
Reviewed Against:

- /docs/rules/view/components/architecture.md
- /docs/rules/view/patterns/react.md
- /docs/rules/view/patterns/server-client-components.md
- /docs/rules/view/components/composition-patterns.md
- /docs/rules/common/typescript/typing.md

## Summary

- Components Analyzed: 3
- Total Violations: 15
- Critical Issues: 4
- Improvement Opportunities: 11

## Violations by Rule Document

### Component Architecture (architecture.md)

1. **Single Responsibility Violation** - InterviewCreationFlow handles too many responsibilities
2. **Missing shadcn/ui Progress component** - Custom progress bar implementation
3. **Inline styles violation** - Using style attributes instead of Tailwind classes

### React Patterns (react.md)

1. **Missing custom hooks** - Complex logic not extracted to custom hooks
2. **State management pattern violation** - Using local state for complex form orchestration
3. **Missing error boundaries** - No error boundary implementation

### Server/Client Components (server-client-components.md)

1. **Unnecessary 'use client' declaration** - All three components are client components when they could be partially server components
2. **Data fetching location violation** - Not leveraging server component benefits

### Composition Patterns (composition-patterns.md)

1. **Props drilling issue** - Translations object passed through multiple levels
2. **Missing component composition** - Form sections could be better composed

### TypeScript Standards (typing.md)

1. **Inline type definitions** - Types defined within component files
2. **Missing Zod schemas** - Form validation not using shared schemas

## Detailed Findings

### 1. InterviewCreationFlow.tsx - Single Responsibility Violation

**Rule Reference**: architecture.md - Section "Single Responsibility Components" (lines 48-96)
**File Location**: InterviewCreationFlow.tsx:43-255
**Current Implementation**:

```typescript
export function InterviewCreationFlow({...}) {
  // Form state management
  const [formState, setFormState] = useState<CreationFormState>({...})

  // Navigation helpers
  const navigateToStep = useCallback(...)
  const navigateToDashboard = useCallback(...)

  // Step 1 handlers
  const handleJobPostingSubmit = useCallback(...)
  const handleJobPostingCancel = useCallback(...)

  // Step 2 handlers
  const handleResumeSubmit = useCallback(...)
  const handleResumePrevious = useCallback(...)

  // Render logic
  const renderCurrentStep = () => {...}
}
```

**Required Correction**:

```typescript
// hooks/useInterviewCreationFlow.ts
export function useInterviewCreationFlow(initialStep: number, locale: string) {
  const [formState, setFormState] = useState<CreationFormState>({...})
  const navigation = useInterviewNavigation(locale)

  return {
    formState,
    handlers: {
      jobPosting: useJobPostingHandlers(setFormState, navigation),
      resume: useResumeHandlers(setFormState, navigation)
    },
    navigation
  }
}

// InterviewCreationFlow.tsx
export function InterviewCreationFlow({...}) {
  const { formState, handlers, navigation } = useInterviewCreationFlow(initialStep, locale)

  return (
    <InterviewCreationLayout step={formState.step}>
      <StepRenderer
        step={formState.step}
        handlers={handlers}
        formState={formState}
      />
    </InterviewCreationLayout>
  )
}
```

**Rationale**: Components should have a single, clear responsibility. The current component handles state management, navigation, form handling, and rendering - violating the Single Responsibility Principle.

### 2. ResumeUploadStep.tsx - Missing shadcn/ui Progress Component

**Rule Reference**: architecture.md - Section "Prefer shadcn/ui Components" (lines 100-128)
**File Location**: ResumeUploadStep.tsx:258-269
**Current Implementation**:

```typescript
<div
  className='h-2 w-full overflow-hidden rounded-full'
  style={{ backgroundColor: designTokens.colors.muted.DEFAULT }}
>
  <div
    className='h-full rounded-full transition-all duration-300 ease-out'
    style={{
      backgroundColor: designTokens.colors.primary.DEFAULT,
      width: `${uploadProgress}%`,
    }}
  />
</div>
```

**Required Correction**:

```typescript
import { Progress } from '@/components/ui/progress'

// In component
<Progress value={uploadProgress} className="w-full" />
```

**Rationale**: The project already has a shadcn/ui Progress component that should be used instead of creating custom implementations.

### 3. All Components - Unnecessary 'use client' Declaration

**Rule Reference**: server-client-components.md - Section "Server Component를 사용해야 하는 경우" (lines 11-50)
**File Location**: All three components start with 'use client'
**Current Implementation**:

```typescript
'use client' // at the top of all files
```

**Required Correction**:

```typescript
// Split static parts into server components
// JobPostingFormLayout.tsx (Server Component)
export function JobPostingFormLayout({ children }: { children: React.ReactNode }) {
  return (
    <Card className='mx-auto w-full max-w-4xl'>
      <CardHeader>
        {/* Static header content */}
      </CardHeader>
      {children}
    </Card>
  )
}

// JobPostingFormInteractive.tsx (Client Component)
'use client'
export function JobPostingFormInteractive({...}) {
  // Only the interactive parts
}
```

**Rationale**: Server Components should be used by default, with Client Components only for interactive parts.

### 4. Props Drilling - Translations Object

**Rule Reference**: composition-patterns.md - Section "Props Drilling Problem" (lines 16-88)
**File Location**: InterviewCreationFlow.tsx:169-183, JobPostingForm.tsx:46-60
**Current Implementation**:

```typescript
// Deep prop passing of translations
<JobPostingForm
  translations={{
    title: t('step1.title'),
    description: t('step1.description'),
    // ... 10+ more translation props
  }}
/>
```

**Required Correction**:

```typescript
// Use context or direct translation hook
// TranslationProvider.tsx
const TranslationContext = createContext<typeof t>()

// In components
export function JobPostingForm() {
  const t = useTranslations('newInterview.step1')
  // Use translations directly
}
```

**Rationale**: Props drilling creates unnecessary coupling. Components should fetch their own translations.

### 5. Missing Custom Hooks for Complex Logic

**Rule Reference**: react.md - Section "Custom Hooks for Logic Extraction" (lines 32-56)
**File Location**: ResumeUploadStep.tsx:67-139
**Current Implementation**:

```typescript
// Complex upload logic inline in component
const uploadFileMutation = api.fileUpload.upload.useMutation({
  onMutate: () => {...},
  onSuccess: data => {...},
  onError: error => {...}
})

const handleSubmit = async () => {
  // Complex file processing logic
}
```

**Required Correction**:

```typescript
// hooks/useFileUpload.ts
export function useFileUpload(
  onUploadSuccess: (data: UploadedFileData) => void
) {
  const [uploadState, setUploadState] = useState<UploadState>()

  const uploadMutation = api.fileUpload.upload.useMutation({
    // Encapsulated upload logic
  })

  const uploadFile = useCallback(async (file: File) => {
    // Handle file processing
  }, [])

  return { uploadState, uploadFile, isUploading: uploadMutation.isPending }
}

// In component
const { uploadState, uploadFile, isUploading } = useFileUpload(onSubmit)
```

**Rationale**: Complex state logic should be extracted into custom hooks for reusability and testing.

### 6. Inline Styles Instead of Design System Classes

**Rule Reference**: architecture.md - Section "안티패턴 금지사항" (line 479)
**File Location**: Multiple locations using `style={{ color: designTokens.colors... }}`
**Current Implementation**:

```typescript
<h1 style={{ color: designTokens.colors.foreground }}>
```

**Required Correction**:

```typescript
// Use Tailwind classes with CSS variables
<h1 className="text-foreground">
```

**Rationale**: Direct style attributes bypass the design system's consistency mechanisms.

## Component Reusability Opportunities

### Identified Patterns

1. **Form Step Component**: The multi-step form pattern could be extracted into a reusable `<MultiStepForm>` component
2. **File Upload with Progress**: Create a reusable `<FileUploadWithProgress>` component
3. **Form Field Groups**: Extract common form field patterns into `<FormFieldGroup>` components

### shadcn/ui Integration

1. **Replace custom progress bar** with `<Progress>` component (already available)
2. **Use `<Skeleton>` for loading states** instead of custom loaders
3. **Leverage `<Tabs>` for step navigation** as an alternative UI pattern

## Recommendations

### Priority 1: Critical Issues (Fix Immediately)

1. **Extract complex logic to custom hooks** - Reduces component complexity and improves testability
2. **Use existing shadcn/ui Progress component** - Maintains consistency and reduces code
3. **Split server and client components** - Improves performance and bundle size
4. **Remove inline styles** - Use Tailwind classes for consistency

### Priority 2: Important Improvements

1. **Implement proper error boundaries** - Add error handling for better UX
2. **Extract multi-step form logic** - Create reusable form orchestration hook
3. **Fix props drilling with composition** - Use context or direct hook usage
4. **Create shared Zod schemas** - Ensure consistent validation

### Priority 3: Nice to Have

1. **Add loading skeletons** - Better loading state UI
2. **Implement proper type exports** - Move types to separate files
3. **Add JSDoc comments** - Improve code documentation

## Education Notes

### Component Architecture Best Practices

- Review `/docs/rules/view/components/architecture.md` Section 1 for composition patterns
- Study Section 2 for shadcn/ui integration standards
- Understand Section 5 for performance considerations

### Server vs Client Components

- Review `/docs/rules/view/patterns/server-client-components.md` for decision criteria
- Focus on Section "컴포넌트 구성 Best Practices" for practical patterns
- Study the "일반적인 안티패턴과 해결책" section

### State Management Patterns

- Review `/docs/rules/view/patterns/react.md` Section 4 for state location strategy
- Understand when to use Context vs Zustand (lines 193-308)
- Learn custom hook composition patterns (Section 3)

## Next Steps

1. Start with Priority 1 fixes - these have the highest impact
2. Refactor one component at a time to maintain stability
3. Add tests for new custom hooks before migration
4. Review with team after implementing Priority 1 fixes
5. Consider creating a component library for common patterns identified
