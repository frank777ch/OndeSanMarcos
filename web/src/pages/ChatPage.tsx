import { ChatInput } from '@/features/chat/components/ChatInput'
import { MessageList } from '@/features/chat/components/MessageList'

export function ChatPage() {
  return (
    <section aria-label="Asistente" className="absolute inset-0 flex flex-col">
      <h1 className="sr-only">Asistente</h1>
      <MessageList />
      <ChatInput />
    </section>
  )
}
