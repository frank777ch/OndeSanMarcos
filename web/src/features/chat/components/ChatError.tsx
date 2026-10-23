import { Button } from '@/components/Button/Button'
import { useChatStore } from '../store/useChatStore'

/** Error de la consulta: solo el mensaje legible, nunca el detalle técnico. */
export function ChatError({ message }: { message: string }) {
  const retry = useChatStore((s) => s.retry)
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-danger">{message}</p>
      <Button variant="secondary" onClick={() => void retry()}>
        Reintentar
      </Button>
    </div>
  )
}
