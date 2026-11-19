import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Box3, MathUtils, Vector3, type Group } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { findAvatar, type AvatarModel } from '@/features/avatar/avatars'
import { useAvatarStore } from '@/features/avatar/useAvatarStore'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { useLocationStore } from '../store/useLocationStore'
import { toLocal } from '../utils/projection'
import { deg, FOV } from './cameraMath'
import { ORDER } from './order'

/** Velocidad de caminata del avatar al acercarse a la ubicación leída (m/s). */
const WALK_SPEED = 1.6
/** Distancia (m) a partir de la cual camina y a la que vuelve a reposo (histéresis, para que no parpadee). */
const START_WALK = 1.2
const STOP_WALK = 0.4
const FADE = 0.25
const GROUND_Y = 0.6

/** Personaje 3D animado que sigue la ubicación del usuario mientras haya una ruta activa. */
export function RouteAvatar() {
  const route = useRouteStore((s) => s.activeRoute)
  const avatar = useAvatarStore((s) => findAvatar(s.avatarId))
  if (!route || !avatar) return null
  return (
    <Suspense fallback={null}>
      <Avatar key={avatar.id} avatar={avatar} />
    </Suspense>
  )
}

function Avatar({ avatar }: { avatar: AvatarModel }) {
  const gltf = useGLTF(avatar.url)
  const model = useMemo(() => {
    const root = clone(gltf.scene)
    root.traverse((o) => {
      o.frustumCulled = false
      o.renderOrder = ORDER.overlay + 4
      // El personaje no debe robar toques a la ruta ni a los lugares.
      o.raycast = () => null
    })
    // Se normaliza a 1 unidad de alto con los pies en y = 0; el alto final en px se aplica al dibujar.
    // Se mide la escena original: en el clon la caja de los modelos con esqueleto sale mal (robot ×30 más chico, soldado ×400 más grande).
    gltf.scene.updateMatrixWorld(true)
    const box = new Box3().setFromObject(gltf.scene, true)
    const height = Math.max(box.max.y - box.min.y, 0.001)
    root.scale.setScalar(1 / height)
    root.position.y = -box.min.y / height
    return root
  }, [gltf.scene])

  const outer = useRef<Group>(null)
  const turner = useRef<Group>(null)
  const { actions } = useAnimations(gltf.animations, model)
  const state = useRef({ x: 0, z: 0, heading: 0, walking: false, placed: false })
  const tmp = useMemo(() => new Vector3(), [])

  // Arranca en reposo.
  useEffect(() => {
    actions[avatar.clips.idle]?.reset().fadeIn(FADE).play()
  }, [actions, avatar])

  useFrame(({ camera, size, invalidate }, dt) => {
    const group = outer.current
    if (!group) return
    const st = state.current
    const position = useLocationStore.getState().position?.coordinates
    const path = useRouteStore.getState().activeRoute?.path
    const target = position ?? path?.[0]
    if (!target) return
    const [tx, tz] = toLocal(target)
    if (!st.placed) {
      st.x = tx
      st.z = tz
      st.placed = true
    }

    const dx = tx - st.x
    const dz = tz - st.z
    const dist = Math.hypot(dx, dz)
    const walking = st.walking ? dist > STOP_WALK : dist > START_WALK
    if (walking) {
      const step = Math.min(dist, Math.max(WALK_SPEED, dist * 0.8) * dt)
      st.x += (dx / dist) * step
      st.z += (dz / dist) * step
      const want = Math.atan2(dx, dz) + avatar.yaw
      // Giro por el camino corto.
      const diff = MathUtils.euclideanModulo(want - st.heading + Math.PI, Math.PI * 2) - Math.PI
      st.heading += diff * Math.min(1, dt * 10)
    }
    if (walking !== st.walking) {
      st.walking = walking
      const from = actions[walking ? avatar.clips.idle : avatar.clips.walk]
      const to = actions[walking ? avatar.clips.walk : avatar.clips.idle]
      from?.fadeOut(FADE)
      to?.reset().fadeIn(FADE).play()
    }

    group.position.set(st.x, GROUND_Y, st.z)
    if (turner.current) turner.current.rotation.y = st.heading
    // Mide siempre `avatar.height` px, como los puntos del mapa (ver ScreenScale).
    const distance = camera.position.distanceTo(tmp.set(st.x, GROUND_Y, st.z))
    group.scale.setScalar(((2 * distance * Math.tan(deg(FOV) / 2)) / size.height) * avatar.height)
    // El lienzo solo pinta bajo demanda: el personaje se anima, así que pide cada cuadro.
    invalidate()
  })

  return (
    <group ref={outer}>
      <group ref={turner}>
        <primitive object={model} />
      </group>
    </group>
  )
}
