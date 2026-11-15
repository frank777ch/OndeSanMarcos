import { act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { campusRings } from '../scene/cameraMath'
import { type CameraApi, type CameraPose, frameListeners, TILT_3D, useCameraStore } from '../scene/cameraStore'
import { CampusPointer } from './CampusPointer'

const container = { current: document.body }
const resetToCampus = vi.fn()
const realReset = useCameraStore.getState().resetToCampus

type Proj = { x: number; y: number; visible: boolean; behind: boolean }

function setup(pose: CameraPose, project: (p: [number, number, number]) => Proj) {
  const api: CameraApi = { pose: () => pose, size: () => ({ width: 1000, height: 800 }), animateTo: vi.fn(), project }
  const { container: dom } = render(<CampusPointer container={container} />)
  act(() => useCameraStore.getState().register(api))
  return dom.querySelector('button')!
}

const inside: CameraPose = { target: campusRings()[0][0], distance: 500, polar: TILT_3D, azimuth: 0 }
const far: CameraPose = { target: [5000, 5000], distance: 500, polar: TILT_3D, azimuth: 0 }

describe('CampusPointer', () => {
  beforeEach(() => {
    useCameraStore.setState({ api: null, resetToCampus })
    resetToCampus.mockClear()
  })
  afterAll(() => useCameraStore.setState({ resetToCampus: realReset }))

  it('con el campus en foco no se muestra', () => {
    // El centro de la vista cae en un punto del contorno: se ve el campus.
    const el = setup(inside, () => ({ x: 500, y: 400, visible: true, behind: false }))
    expect(el.style.display).toBe('none')
  })

  it('sin campus a la vista, apunta hacia donde está (aquí, a la derecha)', () => {
    const el = setup(far, () => ({ x: 3000, y: 400, visible: false, behind: false }))
    expect(el.style.display).toBe('flex')
    expect(el.querySelector('span')!.style.transform).toMatch(/rotate\(0rad\)|rotate\(-?0/)
  })

  it('apunta en cualquier dirección (aquí, hacia arriba)', () => {
    const el = setup(far, () => ({ x: 500, y: -3000, visible: false, behind: false }))
    const rotation = parseFloat(el.querySelector('span')!.style.transform.replace('rotate(', ''))
    expect(rotation).toBeCloseTo(-Math.PI / 2, 1)
  })

  it('si el campus queda detrás de la cámara invierte la dirección', () => {
    const el = setup(far, () => ({ x: 3000, y: 400, visible: false, behind: true }))
    const rotation = parseFloat(el.querySelector('span')!.style.transform.replace('rotate(', ''))
    expect(Math.abs(rotation)).toBeCloseTo(Math.PI, 1)
  })

  it('al pulsarla lleva la cámara al campus', async () => {
    const el = setup(far, () => ({ x: 3000, y: 400, visible: false, behind: false }))
    await userEvent.click(el)
    expect(resetToCampus).toHaveBeenCalled()
  })

  it('se actualiza en cada cuadro', () => {
    let visible = false
    const el = setup(far, () => ({ x: 3000, y: 400, visible, behind: false }))
    expect(el.style.display).toBe('flex')
    visible = true
    act(() => frameListeners.forEach((fn) => fn()))
    expect(el.style.display).toBe('none')
  })
})
