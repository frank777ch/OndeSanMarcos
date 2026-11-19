import { watchPosition } from './geolocation'

describe('watchPosition', () => {
  const clearWatch = vi.fn()
  let success: PositionCallback
  let failure: PositionErrorCallback

  beforeEach(() => {
    clearWatch.mockReset()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition: (ok: PositionCallback, err: PositionErrorCallback) => {
          success = ok
          failure = err
          return 7
        },
        clearWatch,
      },
    })
  })

  it('entrega cada lectura como [lng, lat] y deja de seguir al cancelar', () => {
    const onPosition = vi.fn()
    const stop = watchPosition(onPosition, vi.fn())
    success({ coords: { longitude: -77.08, latitude: -12.05, accuracy: 9 } } as GeolocationPosition)
    expect(onPosition).toHaveBeenCalledWith({ coordinates: [-77.08, -12.05], accuracy: 9 })
    stop()
    expect(clearWatch).toHaveBeenCalledWith(7)
  })

  it('avisa si el permiso fue negado', () => {
    const onError = vi.fn()
    watchPosition(vi.fn(), onError)
    failure({ code: 1, message: 'no' } as GeolocationPositionError)
    expect(onError.mock.calls[0][0].denied).toBe(true)
  })
})
