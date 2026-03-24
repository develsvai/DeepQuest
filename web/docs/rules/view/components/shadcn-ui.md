# shadcn/ui Component Usage Rules

## Overview

This document defines the mandatory rules for using shadcn/ui components in the frontend application. These rules ensure consistent component usage and prevent custom implementations where standard components exist.

## Core Rules

### 1. Component Usage Priority

#### Rule: NEVER Use Raw HTML Elements for UI

- **Requirement**: Always use design system components instead of raw HTML elements
- **Violation Examples**:
  ```tsx
  // ❌ VIOLATION: Raw HTML elements
  <div className="container">Content</div>
  <button onClick={handleClick}>Submit</button>
  <input type="text" value={value} />
  ```
- **Correct Implementation**:

  ```tsx
  // ✅ CORRECT: Design system components
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Card } from '@/components/ui/card';

  <Card>Content</Card>
  <Button onClick={handleClick}>Submit</Button>
  <Input type="text" value={value} />
  ```

#### Rule: Prefer shadcn/ui Components

- **Requirement**: Always check for existing shadcn/ui components before creating custom ones
- **Component Priority**:
  1. Use existing shadcn/ui component
  2. Extend shadcn/ui component with composition
  3. Create new component only if absolutely necessary
- **Common Components**: Button, Card, Input, Select, Dialog, Tabs, Badge, Avatar

### 2. Component Extension Guidelines

#### Rule: Extend via Composition, Not Modification

- **Requirement**: When shadcn/ui components need customization, use composition patterns
- **Violation Example**:
  ```tsx
  // ❌ VIOLATION: Modifying shadcn/ui component directly
  // Editing Button.tsx in @/components/ui/button
  ```
- **Correct Implementation**:

  ```tsx
  // ✅ CORRECT: Composing new component from shadcn/ui
  import { Button } from '@/components/ui/button'
  import { designTokens } from '@/components/design-system/core'

  interface CtaButtonProps {
    children: React.ReactNode
    onClick: () => void
  }

  export const CtaButton = ({ children, onClick }: CtaButtonProps) => {
    return (
      <Button
        variant='default'
        size='lg'
        className='font-bold'
        style={{ backgroundColor: designTokens.colors.accent.DEFAULT }}
        onClick={onClick}
      >
        {children}
      </Button>
    )
  }
  ```

### 3. Available shadcn/ui Components

#### Core UI Components

- **Button**: Primary interactions, CTAs, form submissions
- **Input**: Text input, form fields
- **Textarea**: Multi-line text input
- **Select**: Dropdown selections
- **Checkbox**: Boolean selections
- **Radio**: Single choice selections
- **Switch**: Toggle states

#### Layout Components

- **Card**: Content containers, panels
- **Sheet**: Side panels, drawers
- **Dialog**: Modals, confirmations
- **Tabs**: Content organization
- **Accordion**: Collapsible content
- **Separator**: Visual divisions

#### Feedback Components

- **Alert**: Status messages, notifications
- **Badge**: Status indicators, labels
- **Progress**: Loading states, completion
- **Skeleton**: Loading placeholders
- **Toast**: Temporary notifications

#### Navigation Components

- **Navigation Menu**: Main navigation
- **Breadcrumb**: Page hierarchy
- **Pagination**: Data navigation

### 4. Import Patterns

#### Rule: Use Consistent Import Structure

- **Requirement**: Import shadcn/ui components from their canonical paths
- **Pattern**:
  ```tsx
  // ✅ CORRECT: Canonical imports
  import { Button } from '@/components/ui/button'
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  ```

### 5. Common Usage Patterns

#### Form Components

```tsx
// ✅ CORRECT: Form implementation with shadcn/ui
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LoginForm = () => {
  return (
    <Card className='w-full max-w-sm'>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input id='email' type='email' placeholder='Enter your email' />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <Input id='password' type='password' />
        </div>
        <Button className='w-full'>Sign In</Button>
      </CardContent>
    </Card>
  )
}
```

#### Dialog Usage

```tsx
// ✅ CORRECT: Dialog implementation
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const ConfirmDialog = ({ onConfirm }: { onConfirm: () => void }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='destructive'>Delete Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className='flex justify-end space-x-2'>
          <Button variant='outline'>Cancel</Button>
          <Button variant='destructive' onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Validation Checklist

When reviewing code for shadcn/ui compliance:

- [ ] No raw HTML elements for UI components
- [ ] All UI uses shadcn/ui or composed components
- [ ] Custom components extend via composition, not modification
- [ ] Consistent import patterns from canonical paths
- [ ] Appropriate component selection for use case
- [ ] Proper usage of component variants and props

## Common Violations and Fixes

### Violation: Custom Button Implementation

```tsx
// ❌ VIOLATION
<button className='custom-button'>Click</button>
```

```tsx
// ✅ FIX
import { Button } from '@/components/ui/button'
;<Button variant='default'>Click</Button>
```

### Violation: Raw Form Elements

```tsx
// ❌ VIOLATION
<form>
  <input type='email' />
  <input type='password' />
  <button type='submit'>Submit</button>
</form>
```

```tsx
// ✅ FIX
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
;<form>
  <div>
    <Label htmlFor='email'>Email</Label>
    <Input id='email' type='email' />
  </div>
  <div>
    <Label htmlFor='password'>Password</Label>
    <Input id='password' type='password' />
  </div>
  <Button type='submit'>Submit</Button>
</form>
```

### Violation: Direct Component Modification

```tsx
// ❌ VIOLATION: Editing shadcn/ui source files
// Modifying @/components/ui/button.tsx directly
```

```tsx
// ✅ FIX: Create composed component
import { Button } from '@/components/ui/button'

export const PrimaryButton = ({ children, ...props }) => {
  return (
    <Button variant='default' className='bg-primary-500' {...props}>
      {children}
    </Button>
  )
}
```

## Enforcement

These rules are mandatory and must be enforced during:

- Code reviews
- Component development
- Refactoring sessions
- New feature implementation

Non-compliance should result in:

1. Request for immediate correction using shadcn/ui components
2. Blocking of PR merge until proper components are used
3. Documentation of custom implementations for future shadcn/ui integration
