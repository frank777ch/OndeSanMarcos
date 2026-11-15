import { KINDS, kindOf } from './walkwayKinds'
import { CURRENT_COLOR, OSM_WAYS } from './WalkwaysDebugLayer'
import { useWalkwaysDebug } from './useWalkwaysDebug'

const counts = OSM_WAYS.reduce<Record<string, number>>((acc, w) => {
  const k = kindOf(w)
  acc[k] = (acc[k] ?? 0) + 1
  return acc
}, {})

/** TEMPORAL: leyenda del visor de caminos de OSM. */
export function WalkwaysLegend() {
  const visible = useWalkwaysDebug((s) => s.visible)
  if (!visible) return null
  return (
    <div className="absolute right-4 bottom-20 z-10 max-w-72 rounded-lg bg-bg/95 p-3 text-xs text-ink shadow-lg">
      <p className="mb-2 font-semibold">Caminos de OSM ({OSM_WAYS.length})</p>
      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-5 shrink-0 rounded-full opacity-50" style={{ background: CURRENT_COLOR }} />
          Actual (campus-paths.json)
        </li>
        {KINDS.map((k) => (
          <li key={k.key} className="flex items-center gap-2">
            <span className="h-0.5 w-5 shrink-0" style={{ background: k.color }} />
            {k.label} · {counts[k.key] ?? 0}
          </li>
        ))}
      </ul>
    </div>
  )
}
