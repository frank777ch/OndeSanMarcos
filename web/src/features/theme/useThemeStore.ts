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

interface ThemeState {
  theme: Theme
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const theme = initialTheme()
  apply(theme)
  return {
    theme,
    toggle: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
      apply(next)
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        // Sin localStorage la preferencia no se recuerda: no es grave.
      }
      set({ theme: next })
    },
  }
})
