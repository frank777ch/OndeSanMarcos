import { useEffect, useState } from 'react'

export const MAP_COLOR_VARS = {
  outside: '--map-outside',
  ground: '--map-ground',
  green: '--map-green',
  pitch: '--map-pitch',
  water: '--map-water',
  path: '--map-path',
  building: '--map-building',
  buildingEdge: '--map-building-edge',
  boundary: '--map-boundary',
  label: '--map-label',
  labelHalo: '--map-label-halo',
} as const

export type MapColors = Record<keyof typeof MAP_COLOR_VARS, string>

const FALLBACK: MapColors = {
  outside: '#e9ecef',
  ground: '#f6f5f1',
  green: '#cfe6c3',
  pitch: '#bcdcae',
  water: '#b9d6ea',
  path: '#ffffff',
  building: '#d9d5cc',
  buildingEdge: '#bdb8ac',
  boundary: '#3056ac',
  label: '#0a0a0a',
  labelHalo: '#ffffff',
}

/** Lee las variables `--map-*` del documento; si faltan (tests), usa los colores del tema claro. */
export function readMapColors(root: HTMLElement = document.documentElement): MapColors {
  const style = getComputedStyle(root)
  const out = { ...FALLBACK }
  for (const key of Object.keys(MAP_COLOR_VARS) as (keyof MapColors)[]) {
    const value = style.getPropertyValue(MAP_COLOR_VARS[key]).trim()
    if (value) out[key] = value
  }
  return out
}

/** Colores del mapa; se actualizan al cambiar `data-theme` (RF-40.15). */
export function useMapColors(): MapColors {
  const [colors, setColors] = useState(readMapColors)

  useEffect(() => {
    const update = () => setColors(readMapColors())
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    update()
    return () => observer.disconnect()
  }, [])

  return colors
}
