import { useEffect, useLayoutEffect, useRef } from 'react'
import { MapControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { MapControls as MapControlsImpl } from 'three-stdlib'
import {
  cameraPosition,
  CAMPUS_VIEW,
  clampToBox,
  deg,
  FLAT_POLAR_DEG,
  groundPointAt,
  LABEL_MAX_DISTANCE,
  MAX_DISTANCE,
  MAX_POLAR_DEG,
  MIN_DISTANCE,
} from './cameraMath'
import { type CameraPose, frameListeners, useCameraStore } from './cameraStore'

interface Animation {
  from: CameraPose
  to: CameraPose
  start: number
  duration: number
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Interpola ángulos por el camino corto. */
const lerpAngle = (a: number, b: number, t: number) => {
  const d = ((((b - a) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
  return a + d * t
}

/**
 * Cámara del mapa: arrastrar desplaza, la rueda hace zoom y el botón derecho (o dos dedos) gira e inclina.
 * Mantiene el objetivo dentro de los límites del campus y ofrece las animaciones del store (RF-40.5 a RF-40.7).
 */
export function CampusCamera() {
  const controls = useRef<MapControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const animation = useRef<Animation | null>(null)
  const sizeRef = useRef(size)
  sizeRef.current = size

  const apply = (pose: CameraPose) => {
    const c = controls.current
    if (!c) return
    const [x, y, z] = cameraPosition(pose.target, pose.distance, pose.polar, pose.azimuth)
    camera.position.set(x, y, z)
    c.target.set(pose.target[0], 0, pose.target[1])
    c.update()
  }

  const read = (): CameraPose => {
    const c = controls.current!
    return {
      target: [c.target.x, c.target.z],
      distance: camera.position.distanceTo(c.target),
      polar: c.getPolarAngle(),
      azimuth: c.getAzimuthalAngle(),
    }
  }

  // Vista inicial, antes de pintar el primer cuadro.
  useLayoutEffect(() => {
    apply(CAMPUS_VIEW)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ofrece la cámara al store cuando el lienzo ya tiene tamaño (hasta entonces no se puede encuadrar nada).
  const measured = size.width > 0 && size.height > 0
  useEffect(() => {
    if (!measured) return
    useCameraStore.getState().register({
      pose: read,
      size: () => ({ width: sizeRef.current.width, height: sizeRef.current.height }),
      project: ([x, y, z]) => {
        const v = new Vector3(x, y, z).project(camera)
        const { width, height } = sizeRef.current
        const px = ((v.x + 1) / 2) * width
        const py = ((1 - v.y) / 2) * height
        return { x: px, y: py, behind: v.z >= 1, visible: v.z < 1 && px > -100 && px < width + 100 && py > -50 && py < height + 50 }
      },
      animateTo: (to, duration) => {
        if (!controls.current) return
        if (duration <= 0) {
          animation.current = null
          apply(to)
          useCameraStore.getState().syncFlat(to.polar < deg(FLAT_POLAR_DEG))
          return
        }
        animation.current = { from: read(), to, start: performance.now(), duration }
        invalidate()
      },
    })
    return () => useCameraStore.getState().register(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured])

  // Límites del campus y etiqueta 2D/3D al terminar cada gesto.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    let clamping = false
    const onChange = () => {
      if (clamping) return
      useCameraStore.getState().syncLabels(camera.position.distanceTo(c.target) <= LABEL_MAX_DISTANCE)
      const box = useCameraStore.getState().bounds()
      const [x, z] = clampToBox([c.target.x, c.target.z], box)
      const dx = x - c.target.x
      const dz = z - c.target.z
      if (dx === 0 && dz === 0) return
      clamping = true
      camera.position.x += dx
      camera.position.z += dz
      c.target.x = x
      c.target.z = z
      c.update()
      clamping = false
    }
    const onStart = () => {
      animation.current = null
    }
    const onEnd = () => useCameraStore.getState().syncFlat(c.getPolarAngle() < deg(FLAT_POLAR_DEG))
    c.addEventListener('change', onChange)
    c.addEventListener('start', onStart)
    c.addEventListener('end', onEnd)
    return () => {
      c.removeEventListener('change', onChange)
      c.removeEventListener('start', onStart)
      c.removeEventListener('end', onEnd)
    }
  }, [camera])

  // Pellizco en pantallas táctiles: el punto del suelo bajo los dedos se queda bajo los dedos (zoom localizado).
  // La rueda del ratón ya lo hace con `zoomToCursor`; la librería no lo aplica al pellizco.
  useEffect(() => {
    const c = controls.current
    const el = gl.domElement
    if (!c) return
    const touches = new Map<number, { x: number; y: number }>()
    let anchor: Vector3 | null = null
    let adjusting = false

    const midpointNdc = () => {
      const [a, b] = [...touches.values()]
      const rect = el.getBoundingClientRect()
      return {
        x: (((a.x + b.x) / 2 - rect.left) / rect.width) * 2 - 1,
        y: -((((a.y + b.y) / 2 - rect.top) / rect.height) * 2 - 1),
      }
    }
    const setAnchor = () => {
      anchor = null
      if (touches.size !== 2) return
      const m = midpointNdc()
      anchor = groundPointAt(camera, m.x, m.y)
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      setAnchor()
    }
    const onMove = (e: PointerEvent) => {
      const t = touches.get(e.pointerId)
      if (t) {
        t.x = e.clientX
        t.y = e.clientY
      }
    }
    const onUp = (e: PointerEvent) => {
      if (!touches.delete(e.pointerId)) return
      setAnchor()
    }
    const onChange = () => {
      if (adjusting || !anchor || touches.size !== 2) return
      const m = midpointNdc()
      const now = groundPointAt(camera, m.x, m.y)
      if (!now) return
      const dx = anchor.x - now.x
      const dz = anchor.z - now.z
      if (Math.abs(dx) < 1e-4 && Math.abs(dz) < 1e-4) return
      adjusting = true
      camera.position.x += dx
      camera.position.z += dz
      c.target.x += dx
      c.target.z += dz
      c.update()
      adjusting = false
    }

    // `capture`: se anota la posición de los dedos antes de que la lea el control.
    el.addEventListener('pointerdown', onDown, true)
    el.addEventListener('pointermove', onMove, true)
    el.addEventListener('pointerup', onUp, true)
    el.addEventListener('pointercancel', onUp, true)
    c.addEventListener('change', onChange)
    return () => {
      el.removeEventListener('pointerdown', onDown, true)
      el.removeEventListener('pointermove', onMove, true)
      el.removeEventListener('pointerup', onUp, true)
      el.removeEventListener('pointercancel', onUp, true)
      c.removeEventListener('change', onChange)
    }
  }, [camera, gl])

  useFrame(() => {
    const a = animation.current
    if (!a) {
      frameListeners.forEach((fn) => fn())
      return
    }
    const t = Math.min(1, (performance.now() - a.start) / a.duration)
    const k = ease(t)
    apply({
      target: [lerp(a.from.target[0], a.to.target[0], k), lerp(a.from.target[1], a.to.target[1], k)],
      // La distancia se interpola en escala logarítmica: el zoom se siente parejo.
      distance: Math.exp(lerp(Math.log(a.from.distance), Math.log(a.to.distance), k)),
      polar: lerp(a.from.polar, a.to.polar, k),
      azimuth: lerpAngle(a.from.azimuth, a.to.azimuth, k),
    })
    frameListeners.forEach((fn) => fn())
    if (t >= 1) {
      animation.current = null
      useCameraStore.getState().syncFlat(a.to.polar < deg(FLAT_POLAR_DEG))
    } else {
      invalidate()
    }
  })

  return (
    <MapControls
      ref={controls}
      makeDefault
      enableDamping={false}
      // La rueda hace zoom hacia el punto bajo el cursor, no hacia el centro de la vista.
      zoomToCursor
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={0}
      maxPolarAngle={deg(MAX_POLAR_DEG)}
    />
  )
}
