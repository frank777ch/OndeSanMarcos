import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/Button/Button'
import { parseFieldErrors, uploadPlaceImage } from '@/services/api/adminPlacesApi'
import { ApiError } from '@/services/api/client'

/** Mismos límites que el backend (`POST /api/admin/place-images`); aquí se validan antes de subir. */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

const TYPE_MESSAGE = 'Solo se admiten imágenes JPG, PNG o WebP.'
const SIZE_MESSAGE = 'La imagen pesa más de 5 MB.'
const FAILED_MESSAGE = 'No se pudo subir la imagen. Revisa tu conexión e inténtalo de nuevo.'

interface PlaceImageFieldProps {
  id: string
  /** Dirección de la imagen actual (vacía = sin imagen). */
  value: string
  /** Error del servidor al guardar el lugar (p. ej. una dirección no válida). */
  error?: string
  onChange: (url: string) => void
  /** Avisa mientras se sube, para que el formulario no se guarde a medias. */
  onBusyChange?: (busy: boolean) => void
  /** Texto de la etiqueta; por defecto «Imagen de portada». */
  label?: string
}

/** Imagen de portada de un lugar: se elige un archivo y se sube al almacén al instante. Es opcional. */
export function PlaceImageField({ id, value, error, onChange, onBusyChange, label = 'Imagen de portada' }: PlaceImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const message = uploadError ?? (error || null)
  const errorId = `${id}-error`

  const send = async (file: File) => {
    setUploadError(null)
    if (!ACCEPTED.includes(file.type)) return setUploadError(TYPE_MESSAGE)
    if (file.size > MAX_BYTES) return setUploadError(SIZE_MESSAGE)

    setUploading(true)
    onBusyChange?.(true)
    try {
      onChange(await uploadPlaceImage(file))
    } catch (failure) {
      const detail = parseFieldErrors(failure).general
      // Un 401 ya cerró la sesión; el resto se explica con el texto del servidor o uno genérico.
      if (!(failure instanceof ApiError && failure.status === 401)) setUploadError(detail ?? FAILED_MESSAGE)
    } finally {
      setUploading(false)
      onBusyChange?.(false)
    }
  }

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Vacía el campo para poder elegir otra vez el mismo archivo.
    e.target.value = ''
    if (file) void send(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={pick}
        disabled={uploading}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? errorId : undefined}
        className="sr-only"
      />
      {value && (
        <img src={value} alt="Vista previa de la portada" className="h-32 w-24 rounded-md border border-border object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Subiendo…' : value ? 'Cambiar imagen' : 'Subir imagen'}
        </Button>
        {value && !uploading && (
          <Button size="sm" variant="ghost" onClick={() => onChange('')}>
            Quitar
          </Button>
        )}
        {!value && !uploading && <span className="text-sm text-muted">Opcional. JPG, PNG o WebP de hasta 5 MB.</span>}
      </div>
      {message && (
        <p id={errorId} role="alert" className="m-0 text-sm text-danger">
          {message}
        </p>
      )}
    </div>
  )
}
