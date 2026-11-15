import { act, renderHook, waitFor } from '@testing-library/react'
import { useMapColors } from './useMapColors'

describe('useMapColors', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
  })

  it('RF-40.15: usa los colores del tema y cambia con data-theme', async () => {
    document.documentElement.style.setProperty('--map-ground', '#111111')
    const { result } = renderHook(() => useMapColors())
    expect(result.current.ground).toBe('#111111')

    act(() => {
      document.documentElement.style.setProperty('--map-ground', '#222222')
      document.documentElement.setAttribute('data-theme', 'dark')
    })
    await waitFor(() => expect(result.current.ground).toBe('#222222'))
  })

  it('sin variables usa los colores por defecto', () => {
    const { result } = renderHook(() => useMapColors())
    expect(result.current.building).toMatch(/^#/)
  })
})
