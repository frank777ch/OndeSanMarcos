import { CAMPUS } from '../constants/campus'
import { CAMPUS_VIEW, MIN_DISTANCE, zoomToDistance } from './cameraMath'
import { type CameraApi, type CameraPose, TILT_2D, TILT_3D, useCameraStore } from './cameraStore'
import { toLocal } from '../utils/projection'

function fakeApi(pose: CameraPose) {
  const animateTo = vi.fn()
  const api: CameraApi = {
    pose: () => pose,
    size: () => ({ width: 1000, height: 800 }),
    animateTo,
    project: () => ({ x: 0, y: 0, visible: true, behind: false }),
  }
  return { api, animateTo }
}

const start: CameraPose = { target: [10, 20], distance: 500, polar: TILT_3D, azimuth: 0 }

describe('cameraStore', () => {
  beforeEach(() => useCameraStore.setState({ flat: false, extra: null, api: null }))

  it('sin escena registrada las acciones no hacen nada', () => {
    expect(() => useCameraStore.getState().flyTo(CAMPUS.center)).not.toThrow()
    expect(() => useCameraStore.getState().setFlat(true)).not.toThrow()
  })

  it('RF-40.7: setFlat anima la inclinación a 2D o 3D y conserva el resto', () => {
    const { api, animateTo } = fakeApi(start)
    useCameraStore.getState().register(api)
    useCameraStore.getState().setFlat(true)
    expect(useCameraStore.getState().flat).toBe(true)
    expect(animateTo).toHaveBeenLastCalledWith({ ...start, polar: TILT_2D }, expect.any(Number))
    useCameraStore.getState().setFlat(false)
    expect(animateTo).toHaveBeenLastCalledWith({ ...start, polar: TILT_3D }, expect.any(Number))
  })

  it('RF-40.7: syncFlat sigue a la inclinación real', () => {
    useCameraStore.getState().syncFlat(true)
    expect(useCameraStore.getState().flat).toBe(true)
  })

  it('RF-40.10: flyTo con zoom lleva el objetivo al lugar y la distancia al zoom', () => {
    const { api, animateTo } = fakeApi(start)
    useCameraStore.getState().register(api)
    useCameraStore.getState().flyTo([CAMPUS.center[0] + 0.0005, CAMPUS.center[1]], { zoom: 18 })
    const pose = animateTo.mock.calls[0][0] as CameraPose
    expect(pose.target[0]).toBeCloseTo(toLocal([CAMPUS.center[0] + 0.0005, CAMPUS.center[1]])[0])
    expect(pose.distance).toBe(zoomToDistance(18))
    expect(pose.polar).toBe(start.polar)
  })

  it('flyTo sin zoom conserva la distancia', () => {
    const { api, animateTo } = fakeApi(start)
    useCameraStore.getState().register(api)
    useCameraStore.getState().flyTo(CAMPUS.center)
    expect((animateTo.mock.calls[0][0] as CameraPose).distance).toBe(500)
  })

  it('RF-40.11: fitPoints conserva inclinación y orientación y respeta el zoom máximo', () => {
    const { api, animateTo } = fakeApi({ ...start, azimuth: 0.5 })
    useCameraStore.getState().register(api)
    const a = CAMPUS.center
    const b: [number, number] = [CAMPUS.center[0] + 0.00002, CAMPUS.center[1]]
    useCameraStore.getState().fitPoints([a, b], { top: 0, bottom: 0, left: 0, right: 0 }, { maxZoom: 19 })
    const pose = animateTo.mock.calls[0][0] as CameraPose
    expect(pose.polar).toBe(start.polar)
    expect(pose.azimuth).toBe(0.5)
    expect(pose.distance).toBeGreaterThanOrEqual(zoomToDistance(19))
    expect(pose.distance).toBeGreaterThanOrEqual(MIN_DISTANCE)
  })

  it('RF-40.14: resetToCampus vuelve a la vista inicial en 3D, con la orientación del campus', () => {
    const { api, animateTo } = fakeApi(start)
    useCameraStore.getState().register(api)
    useCameraStore.setState({ flat: true })
    useCameraStore.getState().resetToCampus()
    expect(useCameraStore.getState().flat).toBe(false)
    const pose = animateTo.mock.calls[0][0] as CameraPose
    expect(pose.polar).toBe(TILT_3D)
    expect(pose.azimuth).toBe(CAMPUS_VIEW.azimuth)
    expect(pose.distance).toBeGreaterThan(MIN_DISTANCE)
  })

  it('RF-40.6: setExtra amplía los límites', () => {
    const before = useCameraStore.getState().bounds()
    useCameraStore.getState().setExtra([CAMPUS.center[0] + 0.05, CAMPUS.center[1]])
    expect(useCameraStore.getState().bounds().maxX).toBeGreaterThan(before.maxX)
  })
})
