import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { useAuthStore } from '@/features/admin/store/useAuthStore'
import { ApiError } from '@/services/api/client'

const EXPIRED_MESSAGE = 'Tu sesión expiró. Ingresa de nuevo.'
const INVALID_MESSAGE = 'Usuario o contraseña incorrectos'
const CONNECTION_MESSAGE = 'No se pudo conectar con el servidor. Intenta de nuevo.'

function messageFor(error: unknown): { text: string; blockedForMs: number } {
  if (error instanceof ApiError && error.status === 401) return { text: INVALID_MESSAGE, blockedForMs: 0 }
  if (error instanceof ApiError && error.status === 429) {
    const seconds = error.retryAfterSeconds ?? 60
    const minutes = Math.max(1, Math.ceil(seconds / 60))
    return {
      text: `Demasiados intentos. Espera ${minutes} min e inténtalo de nuevo.`,
      blockedForMs: seconds * 1000,
    }
  }
  return { text: CONNECTION_MESSAGE, blockedForMs: 0 }
}

export function AdminLoginPage() {
  const session = useAuthStore((s) => s.session)
  const clearExpired = useAuthStore((s) => s.clearExpired)
  const login = useAuthStore((s) => s.login)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  // Si llegamos porque el servidor rechazó la sesión, se avisa una vez.
  const [notice, setNotice] = useState<string | null>(() =>
    useAuthStore.getState().expired ? EXPIRED_MESSAGE : null,
  )
  const passwordRef = useRef<HTMLInputElement>(null)
  const sendingRef = useRef(false)

  useEffect(() => clearExpired(), [clearExpired])

  if (session) return <Navigate to="/admin" replace />

  const canSubmit = username !== '' && password !== '' && !sending && !blocked

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit || sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    setError(null)
    setNotice(null)
    try {
      await login(username, password)
      // La sesión nueva hace que se muestre <Navigate to="/admin" />.
    } catch (failure) {
      const { text, blockedForMs } = messageFor(failure)
      setError(text)
      setPassword('')
      if (blockedForMs > 0) {
        setBlocked(true)
        setTimeout(() => setBlocked(false), blockedForMs)
      } else {
        passwordRef.current?.focus()
      }
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  return (
    <main className="flex h-full items-center justify-center bg-surface p-8">
      <form
        onSubmit={handleSubmit}
        aria-label="Ingreso de administrador"
        className="flex w-full max-w-sm flex-col gap-5 rounded-lg border border-border bg-bg p-8 shadow-md"
      >
        <div className="flex flex-col gap-1">
          <span className="font-display text-lg font-bold text-primary">OndeSanMarcos</span>
          <h1 className="text-2xl">Administración</h1>
        </div>
        {notice && (
          <p role="status" className="text-sm text-muted">
            {notice}
          </p>
        )}
        <Input
          label="Usuario"
          name="username"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Contraseña"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          ref={passwordRef}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              className="inline-flex size-9 items-center justify-center border-0 bg-transparent p-0 text-muted shadow-none hover:text-ink"
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          }
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={!canSubmit}>
          {sending ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </main>
  )
}
