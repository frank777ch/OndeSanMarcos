import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/Input/Input'

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'trailing'>

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const action = visible ? 'Ocultar' : 'Mostrar'
  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          aria-label={`${action} ${props.label?.toLowerCase() ?? 'contraseña'}`}
          title={`${action} contraseña`}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="inline-flex size-9 items-center justify-center border-0 bg-transparent p-0 text-muted shadow-none hover:text-ink"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      }
    />
  )
}
