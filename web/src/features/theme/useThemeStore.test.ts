import { THEME_KEY, useThemeStore } from './useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    useThemeStore.setState({ theme: 'light' })
  })

  it('RF-40.19: alternar pone data-theme="dark", lo guarda y vuelve al claro', () => {
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    useThemeStore.getState().toggle()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })

  describe('círculo del cambio de tema', () => {
    afterEach(() => {
      delete (document as { startViewTransition?: unknown }).startViewTransition
      vi.restoreAllMocks()
    })

    it('con View Transitions y un origen, cambia el tema dentro de la transición y anima el círculo', async () => {
      const animate = vi.fn()
      document.documentElement.animate = animate
      const start = vi.fn((update: () => Promise<void> | void) => {
        void update()
        return { ready: Promise.resolve(), finished: Promise.resolve() }
      })
      ;(document as unknown as { startViewTransition: unknown }).startViewTransition = start
      useThemeStore.getState().toggle({ x: 10, y: 20 })
      expect(start).toHaveBeenCalledOnce()
      expect(useThemeStore.getState().theme).toBe('dark')
      await vi.waitFor(() => expect(animate).toHaveBeenCalled())
      const [keyframes, options] = animate.mock.calls[0]
      expect(keyframes.clipPath[0]).toBe('circle(0px at 10px 20px)')
      expect(options.pseudoElement).toBe('::view-transition-new(root)')
    })

    it('sin origen o sin soporte, el tema cambia al instante', () => {
      const start = vi.fn()
      ;(document as unknown as { startViewTransition: unknown }).startViewTransition = start
      useThemeStore.getState().toggle()
      expect(start).not.toHaveBeenCalled()
      expect(useThemeStore.getState().theme).toBe('dark')
      delete (document as { startViewTransition?: unknown }).startViewTransition
      useThemeStore.getState().toggle({ x: 1, y: 1 })
      expect(useThemeStore.getState().theme).toBe('light')
    })
  })
})
