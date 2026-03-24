# Form Handling Patterns

## Overview

이 문서는 Next.js App Router 환경에서 폼 처리, 서버 액션, 그리고 유효성 검사를 위한 일관된 패턴을 정의합니다.

## 폼 응집성 고려사항

**규칙:** 폼 요구사항에 따라 필드 수준 또는 폼 수준 응집성을 선택하세요.

**이유:**

- 필드 독립성(필드 수준)과 폼 통일성(폼 수준) 간의 균형을 맞춥니다.
- 요구사항에 따라 관련 폼 로직이 적절히 그룹화되도록 합니다.

## 서버 액션과 클라이언트 검증 통합

### 기본 패턴: React Hook Form + Zod + Server Actions

```tsx
// app/contact/_components/ContactForm.tsx
'use client'

import { useFormState } from 'react-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { submitContactForm } from '@/app/actions/contact'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// 클라이언트-서버 공유 스키마
const formSchema = z.object({
  name: z.string().min(1, 'Please enter your name.'),
  email: z.string().min(1, 'Please enter your email.').email('Invalid email.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
})

type FormValues = z.infer<typeof formSchema>

export function ContactForm() {
  const [state, formAction] = useFormState(submitContactForm, {
    success: false,
    message: '',
    errors: {},
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  })

  // 서버 액션 성공시 폼 리셋
  React.useEffect(() => {
    if (state.success) {
      reset()
    }
  }, [state.success, reset])

  return (
    <form action={formAction} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='name'>Name</Label>
        <Input
          id='name'
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className='text-sm text-red-500'>{errors.name.message}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          type='email'
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className='text-sm text-red-500'>{errors.email.message}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='message'>Message</Label>
        <Textarea
          id='message'
          {...register('message')}
          className={errors.message ? 'border-red-500' : ''}
        />
        {errors.message && (
          <p className='text-sm text-red-500'>{errors.message.message}</p>
        )}
      </div>

      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>

      {state.message && (
        <div
          className={`rounded p-3 ${
            state.success
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </div>
      )}
    </form>
  )
}
```

### 서버 액션 구현

```typescript
// app/actions/contact.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// 서버측 검증 스키마 (클라이언트와 동일)
const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1).email(),
  message: z.string().min(10),
})

type ContactFormState = {
  success: boolean
  message: string
  errors?: Record<string, string>
}

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  try {
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    }

    // 서버 측 유효성 검사
    const result = formSchema.safeParse(data)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      return {
        success: false,
        message: 'Validation failed',
        errors: Object.fromEntries(
          Object.entries(errors).map(([key, value]) => [key, value?.[0] || ''])
        ),
      }
    }

    // 비즈니스 로직 실행
    await saveContactMessage(result.data)

    // 관련 페이지 재검증
    revalidatePath('/contact')

    return {
      success: true,
      message: 'Message sent successfully!',
    }
  } catch (error) {
    console.error('Contact form error:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to send message',
    }
  }
}

async function saveContactMessage(data: z.infer<typeof formSchema>) {
  // 데이터베이스 저장, 이메일 발송 등
  // 실제 비즈니스 로직 구현
}
```

## 복잡한 폼 패턴

### 다단계 폼 처리

```tsx
// app/onboarding/_components/MultiStepForm.tsx
'use client'

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 단계별 스키마 정의
const step1Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
})

const step2Schema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
})

const step3Schema = z.object({
  preferences: z.array(z.string()).min(1, 'Select at least one preference'),
  newsletter: z.boolean(),
})

// 전체 폼 스키마
const fullFormSchema = step1Schema.and(step2Schema).and(step3Schema)
type FormData = z.infer<typeof fullFormSchema>

export function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const methods = useForm<FormData>({
    resolver: zodResolver(fullFormSchema),
    mode: 'onChange',
  })

  const {
    handleSubmit,
    trigger,
    formState: { isValid },
  } = methods

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['firstName', 'lastName', 'email']
        break
      case 2:
        fieldsToValidate = ['company', 'role']
        break
    }

    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: FormData) => {
    // 최종 제출 로직
    console.log('Form submitted:', data)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        {currentStep === 1 && <PersonalInfoStep />}
        {currentStep === 2 && <CompanyInfoStep />}
        {currentStep === 3 && <PreferencesStep />}

        <div className='flex justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button type='button' onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type='submit' disabled={!isValid}>
              Complete
            </Button>
          )}
        </div>

        {/* 진행 표시기 */}
        <div className='flex space-x-2'>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${
                i + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </form>
    </FormProvider>
  )
}
```

## 동적 폼 필드

### 배열 필드 관리

```tsx
// app/profile/_components/SkillsForm.tsx
'use client'

import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.number().min(1).max(10),
})

const formSchema = z.object({
  skills: z.array(skillSchema).min(1, 'Add at least one skill'),
})

type FormValues = z.infer<typeof formSchema>

export function SkillsForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skills: [{ name: '', level: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'skills',
  })

  const onSubmit = (data: FormValues) => {
    console.log('Skills:', data.skills)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='space-y-3'>
        {fields.map((field, index) => (
          <div key={field.id} className='flex items-end space-x-2'>
            <div className='flex-1'>
              <Input
                {...register(`skills.${index}.name`)}
                placeholder='Skill name'
              />
              {errors.skills?.[index]?.name && (
                <p className='mt-1 text-sm text-red-500'>
                  {errors.skills[index]?.name?.message}
                </p>
              )}
            </div>

            <div className='w-20'>
              <Input
                type='number'
                min='1'
                max='10'
                {...register(`skills.${index}.level`, { valueAsNumber: true })}
                placeholder='Level'
              />
            </div>

            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => remove(index)}
              disabled={fields.length === 1}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <Button
        type='button'
        variant='outline'
        onClick={() => append({ name: '', level: 1 })}
      >
        Add Skill
      </Button>

      <Button type='submit'>Save Skills</Button>
    </form>
  )
}
```

## 실시간 검증 패턴

### 디바운스된 서버 검증

```tsx
// app/signup/_components/UsernameField.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { checkUsernameAvailability } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function UsernameField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle')

  const debouncedUsername = useDebounce(value, 500)

  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      setAvailabilityStatus('checking')

      checkUsernameAvailability(debouncedUsername)
        .then(isAvailable => {
          setAvailabilityStatus(isAvailable ? 'available' : 'unavailable')
        })
        .catch(() => {
          setAvailabilityStatus('idle')
        })
    } else {
      setAvailabilityStatus('idle')
    }
  }, [debouncedUsername])

  const getStatusMessage = () => {
    switch (availabilityStatus) {
      case 'checking':
        return 'Checking availability...'
      case 'available':
        return 'Username is available!'
      case 'unavailable':
        return 'Username is already taken'
      default:
        return ''
    }
  }

  return (
    <div className='space-y-2'>
      <Label htmlFor='username'>Username</Label>
      <Input
        id='username'
        value={value}
        onChange={e => onChange(e.target.value)}
        className={error ? 'border-red-500' : ''}
      />

      {error && <p className='text-sm text-red-500'>{error}</p>}

      {!error && availabilityStatus !== 'idle' && (
        <p
          className={`text-sm ${
            availabilityStatus === 'available'
              ? 'text-green-600'
              : availabilityStatus === 'unavailable'
                ? 'text-red-600'
                : 'text-gray-600'
          }`}
        >
          {getStatusMessage()}
        </p>
      )}
    </div>
  )
}
```

## 폼 상태 관리 베스트 프랙티스

### 1. 에러 상태 관리

- **클라이언트 검증**: 즉시 피드백 제공
- **서버 검증**: 최종 안전장치 역할
- **사용자 친화적 메시지**: 기술적 에러를 이해하기 쉽게 변환

### 2. 로딩 상태 처리

- **제출 중 상태**: 버튼 비활성화 및 로딩 표시
- **백그라운드 검증**: 디바운스로 성능 최적화
- **진행 표시**: 다단계 폼에서 현재 위치 표시

### 3. 데이터 지속성

- **임시 저장**: 사용자 입력 손실 방지
- **세션 복구**: 페이지 새로고침 시 데이터 복원
- **자동 저장**: 중요한 폼에서 주기적 저장
