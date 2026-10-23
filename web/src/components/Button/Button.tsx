import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  icon?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary enabled:hover:bg-primary-hover',
  secondary: 'border-border bg-surface text-ink enabled:hover:bg-surface-strong',
  ghost: 'bg-transparent text-muted enabled:hover:bg-surface',
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  icon,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-6 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
