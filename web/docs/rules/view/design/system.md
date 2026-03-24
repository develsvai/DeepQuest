# Design System Token Rules

## Overview

This document defines the mandatory rules for using design tokens in the frontend application. All components must adhere to these standards to ensure visual consistency and maintainability.

## Core Rules

### 1. Design Token Usage

#### Rule: NEVER Use Hardcoded Colors

- **Requirement**: All color values MUST use designTokens from `/src/components/design-system/core.ts`
- **Violation Examples**:

  ```tsx
  // ❌ VIOLATION: Hardcoded color
  <div style={{ color: '#FF5733' }}>Text</div>
  <div className="text-orange-500">Text</div>

  // ❌ VIOLATION: Direct CSS color
  <div style={{ backgroundColor: 'rgb(255, 87, 51)' }}>Content</div>
  ```

- **Correct Implementation**:

  ```tsx
  import { designTokens } from '@/components/design-system/core';

  // ✅ CORRECT: Using design tokens
  <div style={{ color: designTokens.colors.primary.DEFAULT }}>Text</div>
  <div style={{ backgroundColor: designTokens.colors.card.DEFAULT }}>Content</div>
  ```

#### Rule: ALWAYS Import and Reference Design Tokens

- **Requirement**: Import designTokens at the top of the file and reference via the object
- **Pattern**: `designTokens.colors.*`, `designTokens.spacing.*`, etc.
- **Benefits**: Type safety, autocomplete, single source of truth

### 2. Spacing and Layout

#### Rule: Use Design Token Spacing

- **Requirement**: All spacing must use `designTokens.spacing.*` values
- **Available Values**: xs, sm, md, lg, xl, 2xl, 3xl
- **Example**:
  ```tsx
  // ✅ CORRECT: Design token spacing
  <div
    style={{
      padding: designTokens.spacing.md,
      margin: designTokens.spacing.lg,
    }}
  >
    Content
  </div>
  ```

#### Rule: Use Consistent Border Radius

- **Requirement**: Use `designTokens.radius.*` for all border radius values
- **Available Values**: sm, md, DEFAULT, lg, xl, full
- **Example**:
  ```tsx
  // ✅ CORRECT: Design token radius
  <div style={{ borderRadius: designTokens.radius.lg }}>Rounded content</div>
  ```

### 3. Typography

#### Rule: Use Design System Font Families

- **Requirement**: Reference fonts via `designTokens.typography.fontFamily.*`
- **Available Fonts**: sans, serif, mono
- **Letter Spacing**: Use `designTokens.typography.letterSpacing.*`

### 4. Shadows and Effects

#### Rule: Use Predefined Shadow Tokens

- **Requirement**: Use `designTokens.shadows.*` for all box shadows
- **Available Values**: 2xs, xs, sm, DEFAULT, md, lg, xl, 2xl
- **Example**:
  ```tsx
  // ✅ CORRECT: Design token shadows
  <Card style={{ boxShadow: designTokens.shadows.md }}>Elevated content</Card>
  ```

### 5. Z-Index Management

#### Rule: Use Z-Index Layers

- **Requirement**: Use `designTokens.zIndex.*` for z-index values
- **Layer Hierarchy**:
  - base: 0
  - dropdown: 10
  - sticky: 20
  - overlay: 30
  - modal: 40
  - popover: 50
  - toast: 60
  - tooltip: 70

### 6. Animation Standards

#### Rule: Use Consistent Animation Timing

- **Requirement**: Use `designTokens.animation.duration.*` and `designTokens.animation.easing.*`
- **Durations**: instant, fast, normal, slow, slower
- **Easing**: linear, easeIn, easeOut, easeInOut, bounce
- **Example**:
  ```tsx
  // ✅ CORRECT: Design token animations
  <div
    style={{
      transition: `opacity ${designTokens.animation.duration.normal} ${designTokens.animation.easing.easeInOut}`,
    }}
  >
    Animated content
  </div>
  ```

### 7. Status and Rating Colors

#### Rule: Use Semantic Color Tokens

- **Status Colors**:
  - processing: `designTokens.colors.status.processing`
  - ready: `designTokens.colors.status.ready`
  - failed: `designTokens.colors.status.failed`
- **Rating Colors**:
  - deep: `designTokens.colors.rating.deep`
  - intermediate: `designTokens.colors.rating.intermediate`
  - surface: `designTokens.colors.rating.surface`

### 8. Component Usage Rules

#### Rule: No Raw HTML Elements for UI Components

- **Requirement**: NEVER use raw HTML elements for UI components
- **Violation Examples**:
  ```tsx
  // ❌ VIOLATION: Raw HTML elements
  <div className="card">Card content</div>
  <button onClick={handleClick}>Submit</button>
  <input type="text" value={value} />
  <span className="label">Label</span>
  ```
- **Correct Implementation**:

  ```tsx
  // ✅ CORRECT: Design system components
  import { Card } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';

  <Card>Card content</Card>
  <Button onClick={handleClick}>Submit</Button>
  <Input type="text" value={value} />
  <Label>Label</Label>
  ```

#### Rule: Component Hierarchy

- **Container Elements**: Use `PageContainer`, `Container`, `Card` instead of `<div>`
- **Interactive Elements**: Use `Button`, `Link` instead of `<button>`, `<a>`
- **Form Elements**: Use `Input`, `Select`, `Checkbox` instead of raw form elements
- **Typography**: Use `Heading`, `Text`, `Label` for text content

### 9. shadcn/ui Integration

#### Rule: Prioritize shadcn/ui Components

- **Requirement**: Always check for existing shadcn/ui component before custom implementation
- **Component Discovery Process**:
  1. Check `/src/components/ui/` directory
  2. Review shadcn/ui documentation
  3. Use existing component with variants
  4. Only create custom if no suitable component exists

#### Rule: Component Extension Pattern

- **Extending Components**: Use composition, not modification

  ```tsx
  // ✅ CORRECT: Composition
  const CustomButton = ({ icon, children, ...props }) => (
    <Button {...props}>
      {icon && <Icon name={icon} />}
      {children}
    </Button>
  )

  // ❌ VIOLATION: Direct modification
  // Never modify shadcn/ui components directly
  ```

#### Rule: Variant Usage

- **Requirement**: Use component variants instead of custom styling

  ```tsx
  // ✅ CORRECT: Using variants
  <Button variant="destructive" size="lg">Delete</Button>

  // ❌ VIOLATION: Custom styling
  <Button style={{ backgroundColor: 'red', padding: '20px' }}>Delete</Button>
  ```

### 10. Accessibility Standards

#### Rule: WCAG 2.1 AA Compliance

- **Color Contrast Requirements**:
  - Normal text: Minimum 4.5:1 contrast ratio
  - Large text (18pt+): Minimum 3:1 contrast ratio
  - Interactive elements: Minimum 3:1 contrast ratio
- **Verification**: Use browser DevTools or accessibility checkers

#### Rule: Keyboard Navigation Support

- **Requirements**:
  - All interactive elements must be keyboard accessible
  - Focus indicators must be visible (never remove outline without replacement)
  - Tab order must be logical
  - Skip links for main content navigation
- **Implementation**:

  ```tsx
  // ✅ CORRECT: Visible focus indicator
  <Button className="focus:ring-2 focus:ring-primary">Click me</Button>

  // ❌ VIOLATION: Removing focus indicator
  <button style={{ outline: 'none' }}>Click me</button>
  ```

### 11. Responsive Design

#### Rule: Consistent Breakpoint System

- **Breakpoint Values** (must use these consistently):
  - Mobile: `640px` (sm)
  - Tablet: `768px` (md)
  - Desktop: `1024px` (lg)
  - Wide: `1280px` (xl)
  - Ultra-wide: `1536px` (2xl)

#### Rule: Mobile-First Approach

- **Requirement**: Design for mobile first, then enhance for larger screens
- **Implementation Pattern**:

  ```tsx
  // ✅ CORRECT: Mobile-first responsive design
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {/* Content */}
  </div>

  // ❌ VIOLATION: Desktop-first approach
  <div className="grid grid-cols-3 sm:grid-cols-1">
    {/* Content */}
  </div>
  ```

#### Rule: Responsive Typography

- **Requirement**: Text sizes should scale appropriately across devices
- **Use Relative Units**: `rem` for font sizes, not `px`
- **Scale Factors**: Maintain readable text sizes on all devices

### 12. Performance Considerations

#### Rule: Component Lazy Loading

- **Requirement**: Heavy components should be lazy loaded
- **Implementation**:

  ```tsx
  // ✅ CORRECT: Lazy loading heavy components
  const HeavyChart = lazy(() => import('./HeavyChart'))

  ;<Suspense fallback={<Skeleton />}>
    <HeavyChart />
  </Suspense>
  ```

#### Rule: Image Optimization

- **Requirement**: Use Next.js Image component for all images
- **Benefits**: Automatic optimization, lazy loading, responsive images

  ```tsx
  // ✅ CORRECT: Optimized images
  import Image from 'next/image';
  <Image src="/hero.jpg" alt="Hero" width={1200} height={600} />

  // ❌ VIOLATION: Raw img tag
  <img src="/hero.jpg" alt="Hero" />
  ```

## Validation Checklist

When reviewing code for design system compliance:

### Design Tokens

- [ ] No hardcoded color values anywhere in the code
- [ ] All colors reference `designTokens.colors.*`
- [ ] Spacing uses `designTokens.spacing.*`
- [ ] Border radius uses `designTokens.radius.*`
- [ ] Shadows use `designTokens.shadows.*`
- [ ] Z-index uses `designTokens.zIndex.*`
- [ ] Animations use `designTokens.animation.*`
- [ ] Design system is imported correctly at file top

### Component Usage

- [ ] No raw HTML elements for UI components
- [ ] All UI elements use design system components
- [ ] shadcn/ui components used where available
- [ ] Component variants used instead of custom styling
- [ ] Composition pattern for extending components

### Accessibility

- [ ] WCAG 2.1 AA color contrast met
- [ ] Keyboard navigation fully supported
- [ ] Focus indicators visible
- [ ] Semantic HTML structure maintained

### Responsive Design

- [ ] Mobile-first approach applied
- [ ] Consistent breakpoints used
- [ ] Typography scales appropriately
- [ ] Images optimized with Next.js Image

### Performance

- [ ] Heavy components lazy loaded
- [ ] Images use Next.js Image component
- [ ] Unnecessary re-renders avoided

## Common Violations and Fixes

### Violation: Inline Styles with Hardcoded Values

```tsx
// ❌ VIOLATION
<div style={{ color: '#333', padding: '16px', borderRadius: '8px' }}>
```

```tsx
// ✅ FIX
<div style={{
  color: designTokens.colors.foreground,
  padding: designTokens.spacing.md,
  borderRadius: designTokens.radius.md
}}>
```

### Violation: Tailwind Classes for Colors

```tsx
// ❌ VIOLATION
<div className="text-blue-500 bg-gray-100">
```

```tsx
// ✅ FIX
<div style={{
  color: designTokens.colors.primary.DEFAULT,
  backgroundColor: designTokens.colors.muted.DEFAULT
}}>
```

## Enforcement

These rules are mandatory and must be enforced during:

- Code reviews
- Pre-commit hooks
- CI/CD pipelines
- Automated linting

Non-compliance should result in:

1. Request for immediate correction
2. Blocking of PR merge until fixed
3. Documentation of the violation pattern for team education
