import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { PLACE_CATEGORIES, PLACES } from '../data/places'
import { useMapStore } from '../store/useMapStore'
import styles from './PlaceCard.module.css'

const CATEGORY_LABEL = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<string, string>

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className={styles.list}>
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
    <aside role="dialog" aria-labelledby={titleId} className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2 id={titleId} className={styles.name}>
            {place.name}
          </h2>
          <p className={styles.category}>{CATEGORY_LABEL[place.category]}</p>
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
