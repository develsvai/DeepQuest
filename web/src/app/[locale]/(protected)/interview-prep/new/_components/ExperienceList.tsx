'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

const MAX_EXPERIENCE_NAME_LENGTH = 100

export interface Experience {
  id: string
  name: string
}

interface ExperienceListProps {
  experiences: Experience[]
  onChange: (experiences: Experience[]) => void
  disabled?: boolean
}

export function ExperienceList({
  experiences,
  onChange,
  disabled = false,
}: ExperienceListProps) {
  const t = useTranslations('interview-prep.new.experience')

  // Focus the last input when a new item is added
  const lastInputRef = useRef<HTMLInputElement>(null)
  const [shouldFocusLast, setShouldFocusLast] = useState(false)

  // Auto-add one experience on mount if list is empty (minimum 1 required)
  useEffect(() => {
    if (experiences.length === 0) {
      onChange([{ id: crypto.randomUUID(), name: '' }])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shouldFocusLast && lastInputRef.current) {
      lastInputRef.current.focus()
      setShouldFocusLast(false)
    }
  }, [experiences.length, shouldFocusLast])

  const addExperience = () => {
    // Prevent adding if the last experience is empty
    if (experiences.length > 0) {
      const lastExp = experiences[experiences.length - 1]
      if (!lastExp.name.trim()) {
        return
      }
    }

    const newExperience: Experience = {
      id: crypto.randomUUID(),
      name: '',
    }
    onChange([...experiences, newExperience])
    setShouldFocusLast(true)
  }

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    onChange(
      experiences.map(exp => (exp.id === id ? { ...exp, ...updates } : exp))
    )
  }

  const removeExperience = (id: string) => {
    // Prevent removing if only one experience remains (minimum 1 required)
    if (experiences.length <= 1) return
    onChange(experiences.filter(exp => exp.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') {
      e.preventDefault()
      addExperience()
    }
  }

  return (
    <div className='space-y-4'>
      {/* Instructions */}
      <Alert
        id='experience-instructions'
        className='border border-secondary bg-secondary/20 p-3'
      >
        <AlertDescription>
          <ul className='list-disc space-y-1 pl-4 text-sm text-muted-foreground'>
            <li>
              {t.rich('instructions.line1', {
                b: chunks => (
                  <span className='font-semibold underline underline-offset-2'>
                    {chunks}
                  </span>
                ),
              })}
            </li>
            <li>
              {t.rich('instructions.line2', {
                b: chunks => (
                  <span className='font-semibold underline underline-offset-2'>
                    {chunks}
                  </span>
                ),
              })}
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Experience Items */}
      <div className='space-y-3'>
        {experiences.map((exp, index) => (
          <div key={exp.id} className='flex items-center gap-2'>
            <Input
              id={`experience-${index}`}
              ref={index === experiences.length - 1 ? lastInputRef : null}
              value={exp.name}
              onChange={e => updateExperience(exp.id, { name: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder={t('namePlaceholder')}
              maxLength={MAX_EXPERIENCE_NAME_LENGTH}
              aria-label={t('nameTitle')}
              aria-describedby='experience-instructions'
              className='h-12 flex-1 bg-white text-lg dark:bg-zinc-900'
              disabled={disabled}
            />
            {/* Hide delete button when only one experience remains */}
            {experiences.length > 1 && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => removeExperience(exp.id)}
                aria-label={t('removeLabel')}
                className='h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive'
                disabled={disabled}
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Button */}
      <Button
        type='button'
        variant='outline'
        size='lg'
        className='w-full'
        onClick={addExperience}
        disabled={
          disabled ||
          (experiences.length > 0 &&
            !experiences[experiences.length - 1].name.trim())
        }
      >
        <Plus className='h-4 w-4' />
        {t('addButton')}
      </Button>
    </div>
  )
}
