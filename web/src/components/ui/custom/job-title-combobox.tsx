'use client'

import { useState, useMemo } from 'react'

import { Briefcase, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { JOB_ROLE_KEYS } from '@/lib/constants/job-roles'

interface JobTitleComboboxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  hasError?: boolean
}

export function JobTitleCombobox({
  value,
  onChange,
  disabled,
  hasError,
}: JobTitleComboboxProps) {
  const t = useTranslations('interview-prep.new.form')
  const tJobRoles = useTranslations('interview-prep.new.jobRoles')

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Get translated job roles
  const jobTitles = useMemo(
    () =>
      JOB_ROLE_KEYS.map(key => ({
        key,
        label: tJobRoles(key),
      })),
    [tJobRoles]
  )

  // Manual filtering (to support custom option alongside results)
  const filteredJobTitles = useMemo(() => {
    if (!search.trim()) return jobTitles
    const lowerSearch = search.toLowerCase()
    return jobTitles.filter(job =>
      job.label.toLowerCase().includes(lowerSearch)
    )
  }, [jobTitles, search])

  // Show custom option when search exists and doesn't exactly match any option
  const showCustomOption = useMemo(() => {
    if (!search.trim()) return false
    const lowerSearch = search.trim().toLowerCase()
    return !jobTitles.some(job => job.label.toLowerCase() === lowerSearch)
  }, [jobTitles, search])

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? '' : selectedValue)
    setSearch('')
    setOpen(false)
  }

  const handleSelectCustom = () => {
    onChange(search.trim())
    setSearch('')
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={isOpen => {
        setOpen(isOpen)
        if (!isOpen) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-invalid={hasError}
          className='h-12 w-full justify-between overflow-hidden bg-white text-base font-normal dark:bg-zinc-900'
          disabled={disabled}
        >
          <span className='truncate'>{value || t('rolePlaceholder')}</span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[400px] p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('roleSearchPlaceholder')}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {/* Existing job titles */}
            {filteredJobTitles.length > 0 && (
              <CommandGroup>
                {filteredJobTitles.map(jobRole => (
                  <CommandItem
                    key={jobRole.key}
                    value={jobRole.label}
                    onSelect={handleSelect}
                  >
                    <Briefcase className='mr-2 h-4 w-4' />
                    {jobRole.label}
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        value === jobRole.label ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Custom option - shown at bottom when search doesn't match existing options */}
            {showCustomOption && (
              <CommandGroup
                heading={
                  filteredJobTitles.length > 0 ? t('noRolesFound') : undefined
                }
              >
                <CommandItem onSelect={handleSelectCustom}>
                  <Plus className='mr-2 h-4 w-4' />
                  {t('useCustomJobTitle', { value: search.trim() })}
                </CommandItem>
              </CommandGroup>
            )}

            {/* Empty state - only when no results and no custom option */}
            {filteredJobTitles.length === 0 && !showCustomOption && (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                {t('noRolesFound')}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
