import { useGLTF } from '@react-three/drei'

/** Descarga el modelo antes de que se necesite, para que aparezca sin espera. */
export function preloadAvatar(url: string) {
  useGLTF.preload(url)
}
