import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ChatState, Conversation, Message } from '@features/chat/types';

/** Referencia estable para conversaciones sin mensajes activos. */
const EMPTY_MESSAGES: Message[] = [];

/** Genera un id único para una conversación. */
function newConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Deriva un título legible a partir del primer mensaje del usuario. */
function deriveTitle(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}

interface ChatStore {
  conversations: Conversation[];
  /** Conversación visible; `null` significa una conversación nueva sin guardar. */
  activeId: string | null;
  chatState: ChatState;
  inputText: string;
  isLoading: boolean;
  /** `true` cuando el historial ya se cargó desde AsyncStorage. */
  hasHydrated: boolean;

  setInputText: (text: string) => void;
  setChatState: (state: ChatState) => void;
  setLoading: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  addMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

/** Devuelve los mensajes de la conversación activa (o un arreglo vacío). */
export function selectActiveMessages(state: ChatStore): Message[] {
  const conversation = state.conversations.find(
    (item) => item.id === state.activeId
  );
  return conversation ? conversation.messages : EMPTY_MESSAGES;
}

/**
 * Store de la conversación con el asistente IA.
 * El historial de conversaciones se persiste en AsyncStorage; el estado
 * transitorio (input, carga, conversación activa) se reinicia al abrir la app.
 */
export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      conversations: [],
      activeId: null,
      chatState: 'idle',
      inputText: '',
      isLoading: false,
      hasHydrated: false,

      setInputText: (inputText) => set({ inputText }),
      setChatState: (chatState) => set({ chatState }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      addMessage: (message) =>
        set((state) => {
          const now = new Date().toISOString();

          // Sin conversación activa: se crea una nueva con este mensaje.
          if (state.activeId === null) {
            const conversation: Conversation = {
              id: newConversationId(),
              title:
                message.role === 'user'
                  ? deriveTitle(message.content)
                  : 'Conversación',
              messages: [message],
              createdAt: now,
              updatedAt: now,
            };
            return {
              conversations: [conversation, ...state.conversations],
              activeId: conversation.id,
            };
          }

          // Conversación activa: se agrega el mensaje a la existente.
          return {
            conversations: state.conversations.map((conversation) =>
              conversation.id === state.activeId
                ? {
                    ...conversation,
                    messages: [...conversation.messages, message],
                    updatedAt: now,
                  }
                : conversation
            ),
          };
        }),

      removeMessage: (messageId) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === state.activeId
              ? {
                  ...conversation,
                  messages: conversation.messages.filter(
                    (message) => message.id !== messageId
                  ),
                }
              : conversation
          ),
        })),

      startNewConversation: () =>
        set({
          activeId: null,
          chatState: 'idle',
          inputText: '',
          isLoading: false,
        }),

      selectConversation: (id) =>
        set({
          activeId: id,
          chatState: 'answered',
          inputText: '',
          isLoading: false,
        }),

      deleteConversation: (id) =>
        set((state) => {
          const conversations = state.conversations.filter(
            (conversation) => conversation.id !== id
          );
          const wasActive = state.activeId === id;
          return {
            conversations,
            activeId: wasActive ? null : state.activeId,
            chatState: wasActive ? 'idle' : state.chatState,
          };
        }),
    }),
    {
      name: 'osm-chat-conversations',
      storage: createJSONStorage(() => AsyncStorage, {
        // Revive los `timestamp` (Date) serializados como string ISO.
        reviver: (key, value) =>
          key === 'timestamp' && typeof value === 'string'
            ? new Date(value)
            : value,
      }),
      // Solo se persiste el historial; el resto es estado de sesión.
      partialize: (state) => ({ conversations: state.conversations }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
