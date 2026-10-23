import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'sm' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** `icon`: cuadrado, sin texto (pide `aria-label`). */
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary enabled:hover:bg-primary-hover',
  secondary: 'border-border bg-surface text-ink enabled:hover:bg-surface-strong',
  ghost: 'bg-transparent text-muted enabled:hover:bg-surface',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'px-6 py-3',
  sm: 'px-4 py-2',
  icon: 'size-11 p-0',
}

export function Button({
  variant = 'primary',
  size = 'md',
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
        'inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        SIZES[size],
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
