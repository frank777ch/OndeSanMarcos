import { useRef } from 'react'
import { ArrowDown } from 'lucide-react'
import { IconButton } from '@/components/IconButton/IconButton'
import { useChatStore } from '../store/useChatStore'
import { useStickToBottom } from '../hooks/useStickToBottom'
import { AssistantMessage } from './AssistantMessage'
import { ChatError } from './ChatError'
import { ChatWelcome } from './ChatWelcome'
import { TypingIndicator } from './TypingIndicator'
import { UserMessage } from './UserMessage'

export function MessageList() {
  const messages = useChatStore((s) => s.messages)
  const status = useChatStore((s) => s.status)
  const error = useChatStore((s) => s.error)
  const listRef = useRef<HTMLDivElement>(null)

  // Mi propia pregunta siempre baja al final; una respuesta solo si ya estaba abajo.
  const { away, onScroll, scrollToBottom } = useStickToBottom(
    listRef,
    `${messages.length}:${status}`,
    messages.at(-1)?.role === 'user',
  )

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Conversación"
        onScroll={onScroll}
        className="h-full overflow-y-auto"
      >
        {/* La barra de desplazamiento queda en el borde; el contenido va en una columna de 48 rem. */}
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-6">
          {messages.length === 0 && status === 'idle' && <ChatWelcome />}
          {messages.map((m) =>
            m.role === 'user' ? (
              <UserMessage key={m.id} text={m.text} />
            ) : (
              <AssistantMessage key={m.id} text={m.text} places={m.places} />
            ),
          )}
          {status === 'sending' && <TypingIndicator />}
          {status === 'error' && error && <ChatError message={error} />}
        </div>
      </div>
      {away && (
        <IconButton
          label="Ir al último mensaje"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-md"
          onClick={() => scrollToBottom(true)}
        >
          <ArrowDown size={20} aria-hidden="true" />
        </IconButton>
      )}
    </div>
  )
}
