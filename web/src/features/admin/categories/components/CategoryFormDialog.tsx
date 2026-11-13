import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Modal } from '@/components/Modal/Modal'
import { ApiError } from '@/services/api/client'
import { parseFieldErrors } from '@/services/api/adminPlacesApi'
import type { AdminCategory } from '../../places/types'
import { useAdminCategoriesStore } from '../store/useAdminCategoriesStore'

const HEX = /^#[0-9a-fA-F]{6}$/
const NETWORK_MESSAGE = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.'

interface FormState {
  label: string
  color: string
  sortOrder: string
}

interface CategoryFormDialogProps {
  /** Categoría a editar, o `null` para crear una nueva. */
  category: AdminCategory | null
  onClose: () => void
}

/** Diálogo de crear o editar una categoría (RF-31.29, RF-31.30); mismo comportamiento que el de lugares. */
export function CategoryFormDialog({ category, onClose }: CategoryFormDialogProps) {
  const initial = useMemo<FormState>(
    () => ({
      label: category?.label ?? '',
      color: category?.color ?? '#3056ac',
      sortOrder: category ? String(category.sortOrder) : '',
    }),
    [category],
  )
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const save = useAdminCategoriesStore((s) => s.save)

  const dirty = (Object.keys(initial) as (keyof FormState)[]).some((k) => initial[k].trim() !== form[k].trim())
  const sortValid = form.sortOrder.trim() === '' || /^\d+$/.test(form.sortOrder.trim())
  const valid =
    form.label.trim() !== '' &&
    HEX.test(form.color.trim()) &&
    sortValid

  const field = (name: keyof FormState) => ({
    id: `category-form-${name}`,
    value: form[name],
    error: errors[name] || undefined,
    onChange: (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [name]: e.target.value }))
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    },
  })

  const requestClose = () => {
    if (saving) return
    if (confirmingDiscard) setConfirmingDiscard(false)
    else if (dirty) setConfirmingDiscard(true)
    else onClose()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving || !valid) return
    setSaving(true)
    setErrors({})
    setGeneral(null)
    try {
      await save(category?.id ?? null, {
        label: form.label.trim(),
        color: form.color.trim(),
        sortOrder: form.sortOrder.trim() === '' ? null : Number(form.sortOrder),
      })
      onClose()
    } catch (error) {
      const parsed = parseFieldErrors(error)
      const hasFields = Object.keys(parsed.fields).length > 0
      const validation = error instanceof ApiError && (error.status === 422 || error.status === 409)
      if (validation && (hasFields || parsed.general)) {
        setErrors(parsed.fields)
        setGeneral(parsed.general ?? 'Revisa los campos marcados.')
        const first = (['label', 'color', 'sortOrder'] as const).find((f) => parsed.fields[f])
        if (first) requestAnimationFrame(() => document.getElementById(`category-form-${first}`)?.focus())
      } else if (!(error instanceof ApiError && error.status === 401)) {
        setGeneral(NETWORK_MESSAGE)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title={category ? 'Editar categoría' : 'Nueva categoría'} onClose={requestClose} blurBackdrop>
      <form onSubmit={submit} noValidate className="relative flex flex-col gap-4">
        <div inert={confirmingDiscard} className="flex flex-col gap-4">
          {general && (
            <p role="alert" className="m-0 rounded-md border border-danger px-4 py-3 text-danger">
              {general}
            </p>
          )}
          {category && (
            <p className="m-0 text-sm text-muted">
              Id: <code className="rounded-sm bg-surface px-1.5 py-0.5">{category.id}</code>
              {' · '}
              Slug: <code className="rounded-sm bg-surface px-1.5 py-0.5">{category.slug}</code>
            </p>
          )}
          <Input label="Nombre" required maxLength={100} {...field('label')} />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input label="Color" required placeholder="#RRGGBB" maxLength={7} {...field('color')} />
            </div>
            <input
              type="color"
              aria-label="Elegir color"
              value={HEX.test(form.color) ? form.color : '#000000'}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-12 w-14 cursor-pointer rounded-md border border-border bg-bg p-1"
            />
          </div>
          <Input
            label="Orden"
            inputMode="numeric"
            placeholder={category ? undefined : 'Al final'}
            {...field('sortOrder')}
            error={errors.sortOrder || (sortValid ? undefined : 'Debe ser un número entero.')}
          />
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valid || saving} aria-busy={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>

        {confirmingDiscard && (
          <div
            role="alertdialog"
            aria-labelledby="discard-category-title"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg/95 text-center"
          >
            <h3 id="discard-category-title" className="m-0 text-lg">
              ¿Descartar los cambios?
            </h3>
            <div className="flex gap-3">
              <Button autoFocus variant="secondary" onClick={() => setConfirmingDiscard(false)}>
                Seguir editando
              </Button>
              <Button onClick={onClose}>Descartar</Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
