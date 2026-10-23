import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { useChatStore } from '../store/useChatStore'
import { MAX_QUERY_LENGTH, normalizeQuery } from '../utils/query'

export function ChatInput() {
  const send = useChatStore((s) => s.send)
  const status = useChatStore((s) => s.status)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const sending = status === 'sending'
  const canSend = normalizeQuery(text) !== '' && !sending

  // Foco al entrar y cuando termina una consulta (respuesta o error).
  useEffect(() => {
    if (!sending) inputRef.current?.focus()
  }, [sending])

  // La caja crece con el texto; el tope de 6 líneas lo pone `max-h-36` (9 rem).
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const submit = () => {
    if (!canSend) return
    void send(text)
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    submit()
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-2 pb-6">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-bg p-3 shadow-md focus-within:border-primary">
        <textarea
          ref={inputRef}
          rows={1}
          maxLength={MAX_QUERY_LENGTH}
          aria-label="Escribe tu pregunta"
          placeholder="Puedes preguntarle cualquier información sobre el campus."
          className="max-h-36 min-h-6 flex-1 resize-none bg-transparent px-2 py-1 leading-6 focus-visible:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button
          aria-label="Enviar"
          size="icon"
          disabled={!canSend}
          className="shrink-0"
          onClick={submit}
        >
          <Send size={20} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
