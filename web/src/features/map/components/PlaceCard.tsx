import { useEffect, useId, useRef } from 'react'
import { Route, X } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { IconButton } from '@/components/IconButton/IconButton'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { useMapStore } from '../store/useMapStore'
import { usePlacesStore } from '../store/usePlacesStore'

/** Solo se enlazan direcciones http(s): el dato lo escribe un administrador y no debe llegar un `javascript:` a un `href`. */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 border-t border-border pt-3 text-sm">
      <h3 className="mb-1 font-body text-xs font-bold tracking-wider text-muted uppercase">{title}</h3>
      {children}
    </section>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="m-0 list-disc pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

/** Ficha del lugar elegido. Se muestra mientras haya un lugar seleccionado. */
export function PlaceCard() {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId)
  const clearSelection = useMapStore((s) => s.clearSelection)
  const place = usePlacesStore((s) => (selectedPlaceId ? s.byId[selectedPlaceId] : undefined)) ?? null
  const categoryLabel = usePlacesStore((s) => s.categories.find((c) => c.id === place?.category)?.label)
  const isOpen = place !== null

  // Foco: al abrir va a «Cerrar»; al cerrar vuelve a donde estaba.
  useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement
    closeRef.current?.focus()
    return () => {
      if (previous instanceof HTMLElement && document.contains(previous)) previous.focus()
    }
  }, [isOpen])

  // Esc cierra la ficha.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      // Con un diálogo modal encima (planificar ruta), Esc es suyo: la ficha sigue abierta.
      if (e.key === 'Escape' && !document.querySelector('[aria-modal="true"]')) clearSelection()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, clearSelection])

  if (!place) return null

  const contact = [
    place.phone && `Teléfono: ${place.phone}`,
    place.annex && `Anexo: ${place.annex}`,
    place.email && `Correo: ${place.email}`,
  ].filter(Boolean) as string[]
  const website = place.website ?? null

  return (
    <aside role="dialog" aria-labelledby={titleId} className="mt-auto min-h-0 w-[min(24rem,100%)] flex-[0_1_auto] overflow-y-auto rounded-lg border border-border bg-bg px-6 py-4 shadow-lg">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-lg">
            {place.name}
          </h2>
          <p className="text-sm text-muted">{categoryLabel}</p>
        </div>
        <IconButton ref={closeRef} label="Cerrar" onClick={clearSelection}>
          <X size={18} />
        </IconButton>
      </header>

      <Button
        size="sm"
        fullWidth
        className="mt-3"
        icon={<Route size={16} aria-hidden="true" />}
        onClick={() => useRouteStore.getState().openDialog(place.id)}
      >
        Cómo llegar
      </Button>

      {place.schedule && (
        <Section title="Horario">
          <p>{place.schedule}</p>
        </Section>
      )}
      {place.detailedSchedule && (
        <Section title="Horario detallado">
          <List items={place.detailedSchedule} />
        </Section>
      )}
      {place.description && (
        <Section title="Acerca de este lugar">
          <p>{place.description}</p>
        </Section>
      )}
      {place.usage && (
        <Section title="Uso">
          <p>{place.usage}</p>
        </Section>
      )}
      {place.accessHint && (
        <Section title="Cómo encontrarlo">
          <p>{place.accessHint}</p>
        </Section>
      )}
      {(contact.length > 0 || website) && (
        <Section title="Contacto">
          {contact.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {website && (
            <p>
              Web:{' '}
              {isHttpUrl(website) ? (
                <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary underline [overflow-wrap:anywhere]">
                  {website}
                </a>
              ) : (
                <span className="[overflow-wrap:anywhere]">{website}</span>
              )}
            </p>
          )}
        </Section>
      )}
      {place.careers && (
        <Section title="Carreras">
          <List items={place.careers} />
        </Section>
      )}
      {place.services && (
        <Section title="Servicios">
          <List items={place.services} />
        </Section>
      )}
    </aside>
  )
}
