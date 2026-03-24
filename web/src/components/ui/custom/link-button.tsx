import * as React from 'react'
import { type VariantProps } from 'class-variance-authority'

import { Link } from '@/i18n/navigation'

import { Button, buttonVariants } from '@/components/ui/button'

type LinkButtonProps = Omit<React.ComponentProps<typeof Link>, 'className'> &
  VariantProps<typeof buttonVariants> & {
    className?: string
    disabled?: boolean
    children: React.ReactNode
  }

/**
 * Button styled as a Next.js Link with proper disabled state support.
 *
 * Unlike `<Button asChild><Link /></Button>`, this component correctly
 * handles the disabled state by rendering a non-interactive button
 * instead of a link when disabled.
 */
function LinkButton({
  className,
  variant,
  size,
  disabled = false,
  href,
  children,
  ...props
}: LinkButtonProps) {
  if (disabled) {
    return (
      <Button variant={'outline'} size={size} className={className} disabled>
        {children}
      </Button>
    )
  }

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href={href} {...props}>
        {children}
      </Link>
    </Button>
  )
}

export { LinkButton }
