import { Canvas } from '@react-three/fiber'
import { useRouteStore } from '@/features/routing/store/useRouteStore'
import { CampusCamera } from './CampusCamera'
import { FOV } from './cameraMath'
import { WalkwaysDebugLayer } from '@/features/routing/debug/WalkwaysDebugLayer'
import { RouteRemoveButton } from '@/features/routing/components/RouteRemoveButton'
import { PlaceMarkers } from './PlaceMarkers'
import { RouteLine } from './RouteLine'
import { UserLocation } from './UserLocation'
import { Boundary, Buildings, GreenAreas, Ground, Paths, Roads } from './layers'
import { useMapColors } from './useMapColors'

/** Escena 3D del campus (HU-40): suelo, verde, caminos, edificios y contorno, con la cámara propia. */
export function CampusScene() {
  const colors = useMapColors()
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop="demand"
      camera={{ fov: FOV, near: 5, far: 9000 }}
      gl={{ antialias: true }}
      // Tocar una zona sin nada interactivo oculta la «X» de la ruta.
      onPointerMissed={() => useRouteStore.getState().setRouteHover(null)}
      aria-label="Mapa del campus"
    >
      <color attach="background" args={[colors.outside]} />
      <ambientLight intensity={2.3} />
      <directionalLight position={[250, 600, 180]} intensity={1.3} />
      <CampusCamera />
      <Ground colors={colors} />
      <GreenAreas colors={colors} />
      <Roads colors={colors} />
      <Paths colors={colors} />
      <Boundary colors={colors} />
      <Buildings colors={colors} />
      <PlaceMarkers />
      <RouteLine />
      <WalkwaysDebugLayer />
      <RouteRemoveButton />
      <UserLocation />
    </Canvas>
  )
}
