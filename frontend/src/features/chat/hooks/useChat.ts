import { useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Config } from '@constants/config';
import { selectActiveMessages, useChatStore } from '@store/useChatStore';
import { useMapStore } from '@store/useMapStore';
import { sendChatQuery } from '@services/api/chatApi';
import type { MainTabsParamList } from '@navigation/types';
import { mockChatQuery } from '../constants/mockChat';
import type { ChatResponse, ChatState, Message } from '../types';

let idCounterSeed = 0;
/** Genera un id único y estable para cada mensaje. */
function nextId(): string {
  idCounterSeed += 1;
  return `${Date.now()}-${idCounterSeed}`;
}

const ERROR_MESSAGE =
  'Lo siento, ocurrió un error al procesar tu consulta. Inténtalo de nuevo.';

/**
 * Obtiene la respuesta del asistente.
 * En modo mock responde con plantillas (nunca falla). Con backend real
 * lanza el error para que la UI muestre el mensaje y el botón "Reintentar".
 */
function resolveResponse(query: string): Promise<ChatResponse> {
  return Config.chat.useMock ? mockChatQuery(query) : sendChatQuery(query);
}

const easeInEaseOut = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

export interface UseChatResult {
  messages: Message[];
  chatState: ChatState;
  inputText: string;
  isLoading: boolean;
  onChangeText: (text: string) => void;
  sendMessage: () => Promise<void>;
  retryMessage: (errorMessage: Message) => Promise<void>;
  resetChat: () => void;
}

/**
 * Maneja la conversación activa con el asistente IA.
 * El estado vive en `useChatStore` (historial persistido en AsyncStorage).
 */
export function useChat(): UseChatResult {
  const messages = useChatStore(selectActiveMessages);
  const chatState = useChatStore((state) => state.chatState);
  const inputText = useChatStore((state) => state.inputText);
  const isLoading = useChatStore((state) => state.isLoading);

  const setInputText = useChatStore((state) => state.setInputText);
  const setChatState = useChatStore((state) => state.setChatState);
  const setLoading = useChatStore((state) => state.setLoading);
  const addMessage = useChatStore((state) => state.addMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const startNewConversation = useChatStore(
    (state) => state.startNewConversation
  );

  // Enrutamiento automático (HU-2.3): cuando el backend marca `drawRoute`, el
  // chat fija el destino en el store del mapa y salta a la pestaña Mapa.
  const navigation = useNavigation<NavigationProp<MainTabsParamList>>();
  const setFocusTarget = useMapStore((state) => state.setFocusTarget);

  const onChangeText = useCallback(
    (text: string) => {
      setInputText(text);
      // Solo transiciona entre idle <-> asking; en answered no se toca.
      if (chatState === 'idle' && text.trim().length > 0) {
        easeInEaseOut();
        setChatState('asking');
      } else if (chatState === 'asking' && text.trim().length === 0) {
        easeInEaseOut();
        setChatState('idle');
      }
    },
    [chatState, setInputText, setChatState]
  );

  /** Pide la respuesta del assistant y agrega el mensaje resultante. */
  const requestAssistantReply = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const response = await resolveResponse(query);
        addMessage({
          id: nextId(),
          role: 'assistant',
          content: response.answer,
          locations: response.locations,
          timestamp: new Date(),
        });
        if (response.drawRoute && response.destination) {
          setFocusTarget({
            latitude: response.destination.latitude,
            longitude: response.destination.longitude,
            name: response.locations[0]?.name,
            drawRoute: true,
            entranceCoordinate: response.locations[0]?.entranceCoordinate,
          });
          navigation.navigate('Map');
        }
      } catch {
        addMessage({
          id: nextId(),
          role: 'assistant',
          content: ERROR_MESSAGE,
          timestamp: new Date(),
          isError: true,
          failedQuery: query,
        });
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, navigation, setFocusTarget]
  );

  const sendMessage = useCallback(async () => {
    const query = inputText.trim();
    if (query.length === 0 || isLoading) return;

    easeInEaseOut();
    addMessage({
      id: nextId(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    });
    setInputText('');
    setChatState('answered');

    await requestAssistantReply(query);
  }, [
    inputText,
    isLoading,
    addMessage,
    setInputText,
    setChatState,
    requestAssistantReply,
  ]);

  const retryMessage = useCallback(
    async (errorMessage: Message) => {
      if (isLoading || !errorMessage.failedQuery) return;
      removeMessage(errorMessage.id);
      await requestAssistantReply(errorMessage.failedQuery);
    },
    [isLoading, removeMessage, requestAssistantReply]
  );

  const resetChat = useCallback(() => {
    easeInEaseOut();
    startNewConversation();
  }, [startNewConversation]);

  return {
    messages,
    chatState,
    inputText,
    isLoading,
    onChangeText,
    sendMessage,
    retryMessage,
    resetChat,
  };
}
