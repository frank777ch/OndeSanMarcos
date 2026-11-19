export interface AvatarModel {
  id: string
  label: string
  /** Emoji del botón del menú. */
  icon: string
  /** Archivo GLB en `public/avatars/`. */
  url: string
  /** Nombres de las animaciones dentro del archivo. */
  clips: { idle: string; walk: string }
  /** Alto del personaje en pantalla (px). */
  height: number
  /** Giro (rad) para que el frente del modelo mire hacia donde avanza. */
  yaw: number
}

/** Modelos disponibles (todos CC0, ver `public/avatars/CREDITS.md`). Para añadir uno: copiar su GLB a `public/avatars/` y sumar una línea aquí. */
export const AVATARS: AvatarModel[] = [
  { id: 'robot', label: 'Robot', icon: '🤖', url: '/avatars/robot.glb', clips: { idle: 'Idle', walk: 'Walking' }, height: 34, yaw: 0 },
  { id: 'knight', label: 'Caballero', icon: '🛡️', url: '/avatars/knight.glb', clips: { idle: 'Idle', walk: 'Walking_A' }, height: 34, yaw: 0 },
  { id: 'mage', label: 'Mago', icon: '🧙', url: '/avatars/mage.glb', clips: { idle: 'Idle', walk: 'Walking_A' }, height: 34, yaw: 0 },
  { id: 'rogue', label: 'Pícaro', icon: '🗡️', url: '/avatars/rogue.glb', clips: { idle: 'Idle', walk: 'Walking_A' }, height: 34, yaw: 0 },
  { id: 'panda', label: 'Panda', icon: '🐼', url: '/avatars/panda.glb', clips: { idle: 'Idle', walk: 'Walk' }, height: 34, yaw: 0 },
  { id: 'fish', label: 'Pez', icon: '🐟', url: '/avatars/fish.glb', clips: { idle: 'Idle', walk: 'Walk' }, height: 28, yaw: 0 },
  // La cara del gusano mira unos 51° a un lado del eje del modelo.
  { id: 'worm', label: 'Gusano', icon: '🐛', url: '/avatars/worm.glb', clips: { idle: 'Idle', walk: 'Walk' }, height: 24, yaw: 0.89 },
]

export function findAvatar(id: string | null): AvatarModel | null {
  return AVATARS.find((a) => a.id === id) ?? null
}
