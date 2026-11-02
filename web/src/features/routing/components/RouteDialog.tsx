import { useRef, useState } from 'react'
import { ArrowDownUp } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { IconButton } from '@/components/IconButton/IconButton'
import { Modal } from '@/components/Modal/Modal'
import { PlaceCombobox } from '../../map/components/PlaceCombobox'
import { useRouteStore } from '../store/useRouteStore'
import { pointLabel, type RoutePoint } from '../utils/planRoute'
import { RouteResult } from './RouteResult'

const MY_LOCATION = 'my-location'

/**
 * Texto de un campo: lo que el usuario está escribiendo (`draft`) o, si no, el
 * nombre del punto elegido.
 */
function useFieldText(point: RoutePoint | null, setPoint: (p: RoutePoint | null) => void) {
  const [draft, setDraft] = useState<string | null>(null)
  return {
    value: draft ?? (point ? pointLabel(point) : ''),
    // Editar el texto descarta el lugar elegido hasta que elija otro (RF-13.11).
    onValueChange: (text: string) => {
      setDraft(text)
      if (point) setPoint(null)
    },
    choose: (p: RoutePoint) => {
      setDraft(null)
      setPoint(p)
    },
    clear: () => {
      setDraft(null)
      setPoint(null)
    },
    resetDraft: () => setDraft(null),
  }
}

export function RouteDialog() {
  const open = useRouteStore((s) => s.open)
  const origin = useRouteStore((s) => s.origin)
  const destination = useRouteStore((s) => s.destination)
  const status = useRouteStore((s) => s.status)
  const result = useRouteStore((s) => s.result)
  const hasActiveRoute = useRouteStore((s) => s.activeRoute !== null)
  const originRef = useRef<HTMLInputElement>(null)
  const destinationRef = useRef<HTMLInputElement>(null)

  const from = useFieldText(origin, useRouteStore.getState().setOrigin)
  const to = useFieldText(destination, useRouteStore.getState().setDestination)
  const locating = status === 'locating'

  const swap = () => {
    from.resetDraft()
    to.resetDraft()
    useRouteStore.getState().swap()
  }

  return (
    <Modal
      open={open}
      title="Planificar ruta"
      mobileSheet
      onClose={() => useRouteStore.getState().closeDialog()}
      initialFocus={() => (origin ? destinationRef.current : originRef.current)}
    >
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <PlaceCombobox
            className="w-full"
            portalList
            label="Punto de partida"
            clearLabel="Limpiar punto de partida"
            value={from.value}
            onValueChange={from.onValueChange}
            onChoose={(place) => from.choose({ kind: 'place', placeId: place.id })}
            onClear={from.clear}
            extraOptions={[{ id: MY_LOCATION, label: 'Mi ubicación' }]}
            onChooseExtra={() => {
              from.resetDraft()
              void useRouteStore.getState().chooseMyLocation()
            }}
            inputRef={originRef}
            disabled={locating}
            busy={locating}
          />
          <PlaceCombobox
            className="w-full"
            portalList
            label="Destino"
            clearLabel="Limpiar destino"
            value={to.value}
            onValueChange={to.onValueChange}
            onChoose={(place) => to.choose({ kind: 'place', placeId: place.id })}
            onClear={to.clear}
            inputRef={destinationRef}
          />
        </div>
        <IconButton label="Intercambiar" onClick={swap} disabled={locating}>
          <ArrowDownUp size={18} />
        </IconButton>
      </div>
      <RouteResult />
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        {hasActiveRoute && (
          <Button variant="secondary" onClick={() => useRouteStore.getState().clearActiveRoute()}>
            Quitar ruta
          </Button>
        )}
        <Button disabled={!result?.ok} onClick={() => useRouteStore.getState().startRoute()}>
          Iniciar ruta
        </Button>
      </div>
    </Modal>
  )
}
