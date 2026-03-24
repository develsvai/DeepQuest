'use client'

import { Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Props for URLInput component
 * @property value - Current URL value
 * @property onChange - Callback when URL changes
 * @property onValidate - Optional async validation function
 * @property placeholder - Placeholder text
 * @property label - Label text
 * @property required - Whether the field is required
 * @property disabled - Whether the input is disabled
 * @property className - Additional CSS classes
 */
interface URLInputProps {
  value?: string
  onChange?: (value: string) => void
  onValidate?: (url: string) => Promise<boolean>
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

/**
 * URL input component with validation
 * Shows validation status (valid, invalid, loading)
 */
export function URLInput({
  value = '',
  onChange,
  onValidate,
  placeholder = 'https://example.com',
  label = '',
  required = false,
  disabled = false,
  className,
}: URLInputProps) {
  const [url, setUrl] = useState(value)
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'valid' | 'invalid'
  >('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setUrl(value)
  }, [value])

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string)
      return url.protocol === 'https:'
    } catch {
      return false
    }
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!url) {
        setValidationStatus('idle')
        setErrorMessage(null)
        return
      }

      if (!isValidUrl(url)) {
        setValidationStatus('invalid')
        setErrorMessage('Please enter a valid URL')
        return
      }

      if (onValidate) {
        setIsValidating(true)
        setValidationStatus('idle')
        setErrorMessage(null)

        try {
          const isValid = await onValidate(url)
          setValidationStatus(isValid ? 'valid' : 'invalid')
          if (!isValid) {
            setErrorMessage('URL validation failed')
          }
        } catch {
          setValidationStatus('invalid')
          setErrorMessage('Error validating URL')
        } finally {
          setIsValidating(false)
        }
      } else {
        setValidationStatus('valid')
        setErrorMessage(null)
      }
    }, 500) // Debounce validation

    return () => clearTimeout(timer)
  }, [url, onValidate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setUrl(newValue)
    onChange?.(newValue)
  }

  const getIcon = () => {
    if (isValidating) {
      return <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
    }
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className='h-4 w-4 text-ring' />
      case 'invalid':
        return <XCircle className='h-4 w-4 text-destructive' />
      default:
        return <Globe className='h-4 w-4 text-muted-foreground' />
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor='url-input'>
          {label}
          {required && <span className='ml-1 text-destructive'>*</span>}
        </Label>
      )}
      <div className='relative'>
        <Input
          id='url-input'
          type='url'
          value={url}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={validationStatus === 'invalid' ? true : undefined}
          className='pl-10'
        />
        <div className='absolute top-1/2 left-3 -translate-y-1/2'>
          {getIcon()}
        </div>
      </div>
      {errorMessage && (
        <p className='text-sm text-destructive'>{errorMessage}</p>
      )}
    </div>
  )
}
