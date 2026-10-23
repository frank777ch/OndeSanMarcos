import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { PLACE_CATEGORIES, PLACES } from '../data/places'
import { useMapStore } from '../store/useMapStore'

const CATEGORY_LABEL = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<string, string>

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
  const place = PLACES.find((p) => p.id === selectedPlaceId) ?? null
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
      if (e.key === 'Escape') clearSelection()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, clearSelection])

  if (!place) return null

  const contact = [
    place.phone && `Teléfono: ${place.phone}`,
    place.annex && `Anexo: ${place.annex}`,
  ].filter(Boolean) as string[]

  return (
    <aside role="dialog" aria-labelledby={titleId} className="mt-auto min-h-0 w-[min(24rem,100%)] flex-[0_1_auto] overflow-y-auto rounded-lg border border-border bg-bg px-6 py-4 shadow-lg">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-lg">
            {place.name}
          </h2>
          <p className="text-sm text-muted">{CATEGORY_LABEL[place.category]}</p>
        </div>
        <IconButton ref={closeRef} label="Cerrar" onClick={clearSelection}>
          <X size={18} />
        </IconButton>
      </header>

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
      {contact.length > 0 && (
        <Section title="Contacto">
          {contact.map((line) => (
            <p key={line}>{line}</p>
          ))}
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
