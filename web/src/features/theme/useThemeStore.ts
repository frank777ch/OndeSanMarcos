import { create } from 'zustand'

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'osm:theme'

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** Tema guardado; si no hay, el del sistema. */
function initialTheme(): Theme {
  const saved = stored()
  if (saved) return saved
  const dark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
  return dark ? 'dark' : 'light'
}

function apply(theme: Theme) {
  if (typeof document === 'undefined') return
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
}

/** Punto de la pantalla (px) desde el que nace el círculo del cambio de tema. */
export interface ThemeOrigin {
  x: number
  y: number
}

const TRANSITION_MS = 500

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => { ready: Promise<void>; finished: Promise<void> }
}

/** Espera a que React y el lienzo del mapa pinten con el tema nuevo (con tope, por si la pestaña no pinta). */
function nextPaint(): Promise<void> {
  const frames = new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  const cap = new Promise<void>((resolve) => setTimeout(resolve, 150))
  return Promise.race([frames, cap])
}

function canAnimate(): boolean {
  if (typeof document === 'undefined' || typeof (document as ViewTransitionDocument).startViewTransition !== 'function') {
    return false
  }
  return !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
}

interface ThemeState {
  theme: Theme
  /** Alterna el tema. Con `origin` (y si el navegador lo permite) el tema nuevo crece como un círculo desde ese punto. */
  toggle: (origin?: ThemeOrigin) => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const theme = initialTheme()
  apply(theme)
  return {
    theme,
    toggle: (origin) => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
      const change = () => {
        apply(next)
        try {
          localStorage.setItem(THEME_KEY, next)
        } catch {
          // Sin localStorage la preferencia no se recuerda: no es grave.
        }
        set({ theme: next })
      }

      if (!origin || !canAnimate()) {
        change()
        return
      }

      const transition = (document as ViewTransitionDocument).startViewTransition!(async () => {
        change()
        await nextPaint()
      })
      const radius = Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y),
      )
      void transition.ready
        .then(() => {
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
            { duration: TRANSITION_MS, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
          )
        })
        .catch(() => {
          // La transición se canceló (otra se inició encima): el tema ya cambió igual.
        })
    },
  }
})
