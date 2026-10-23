import type { ComponentPropsWithRef, ReactNode } from 'react'
import styles from './IconButton.module.css'

interface IconButtonProps extends ComponentPropsWithRef<'button'> {
  /** Texto accesible (obligatorio: el botón no tiene texto visible). */
  label: string
  children: ReactNode
}

export function IconButton({
  label,
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
