import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** Distancia al final a partir de la cual se considera que el usuario subió a releer. */
export const NEAR_BOTTOM_PX = 120

/**
 * Mantiene la lista pegada al final. Cuando `changeKey` cambia baja si el
 * usuario estaba cerca del final o si `forceBottom` es true; si estaba más
 * arriba no lo mueve y `away` queda en true para ofrecer «Ir al último mensaje».
 */
export function useStickToBottom(
  ref: RefObject<HTMLElement | null>,
  changeKey: string,
  forceBottom: boolean,
) {
  const nearBottom = useRef(true)
  const [away, setAway] = useState(false)

  const scrollToBottom = useCallback(
    (smooth = false) => {
      const el = ref.current
      if (!el) return
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (smooth && !reduced && el.scrollTo) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      } else {
        el.scrollTop = el.scrollHeight
      }
    },
    [ref],
  )

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX
    nearBottom.current = near
    setAway(!near)
  }, [ref])

  useEffect(() => {
    if (forceBottom || nearBottom.current) scrollToBottom()
  }, [changeKey, forceBottom, scrollToBottom])

  return { away, onScroll, scrollToBottom }
}
