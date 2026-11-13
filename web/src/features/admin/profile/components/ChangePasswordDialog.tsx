import { useState, type FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Modal } from '@/components/Modal/Modal'
import { PasswordInput } from '@/components/PasswordInput/PasswordInput'
import { useToastStore } from '@/components/Toast/toastStore'
import { ApiError } from '@/services/api/client'
import { changePassword } from '@/services/api/adminClient'
import { parseFieldErrors } from '@/services/api/adminPlacesApi'
import { MIN_PASSWORD_LENGTH, validatePasswordForm, type PasswordErrors } from '../passwordRules'

const EMPTY = { current: '', next: '', confirm: '' }

function waitText(seconds?: number): string {
  if (!seconds) return 'Demasiados intentos fallidos. Inténtalo más tarde.'
  const minutes = Math.ceil(seconds / 60)
  return `Demasiados intentos fallidos. Vuelve a intentarlo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`
}

/** Diálogo para cambiar la contraseña del administrador (HU-37). */
export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [general, setGeneral] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const close = () => {
    if (submitting) return
    setForm(EMPTY)
    setErrors({})
    setGeneral(undefined)
    onClose()
  }
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const found = validatePasswordForm(form)
    setErrors(found)
    setGeneral(undefined)
    if (Object.keys(found).length > 0) return
    setSubmitting(true)
    try {
      await changePassword(form.current, form.next)
      setSubmitting(false)
      setForm(EMPTY)
      onClose()
      useToastStore.getState().show('Contraseña actualizada', 'success')
    } catch (error) {
      setSubmitting(false)
      if (error instanceof ApiError && error.status === 403) {
        setErrors({ current: 'La contraseña actual no es correcta.' })
      } else if (error instanceof ApiError && error.status === 429) {
        setGeneral(waitText(error.retryAfterSeconds))
      } else if (error instanceof ApiError && error.status === 422) {
        const { fields, general: other } = parseFieldErrors(error)
        setErrors({ next: fields.newPassword, current: fields.currentPassword })
        if (!fields.newPassword && !fields.currentPassword) setGeneral(other ?? 'Revisa los datos e inténtalo de nuevo.')
      } else if (error instanceof ApiError && error.status === 401) {
        // La sesión venció: adminClient ya la cerró y el guardián lleva al login.
      } else {
        setGeneral('No pudimos cambiar la contraseña. Inténtalo de nuevo.')
      }
    }
  }

  return (
    <Modal open={open} title="Cambiar contraseña" onClose={close} blurBackdrop>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordInput
          label="Contraseña actual"
          name="current-password"
          autoComplete="current-password"
          required
          value={form.current}
          onChange={set('current')}
          error={errors.current}
        />
        <PasswordInput
          label="Contraseña nueva"
          name="new-password"
          autoComplete="new-password"
          required
          value={form.next}
          onChange={set('next')}
          error={errors.next}
        />
        <p className="-mt-2 text-sm text-muted">
          Al menos {MIN_PASSWORD_LENGTH} caracteres, con letras y números.
        </p>
        <PasswordInput
          label="Confirmar contraseña nueva"
          name="confirm-password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        {general && (
          <p role="alert" className="text-sm text-danger">
            {general}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
