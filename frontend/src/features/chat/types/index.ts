/**
 * Tipos del feature de chat (asistente IA de OndeSanMarcos).
 */

/** Estados visuales de la pantalla de chat. */
export type ChatState = 'idle' | 'asking' | 'answered';

/** Mensaje individual de la conversación. */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  /** Lugares devueltos por la IA (solo en mensajes del assistant). */
  locations?: LocationResult[];
  /** Marca un mensaje del assistant como error recuperable. */
  isError?: boolean;
  /** Consulta original que falló, usada por el botón "Reintentar". */
  failedQuery?: string;
}

/** Lugar del campus devuelto como resultado de una consulta. */
export interface LocationResult {
  id: string;
  name: string;
  schedule?: string;
}

/** Respuesta del endpoint `/api/chat`. */
export interface ChatResponse {
  answer: string;
  locations: LocationResult[];
}

/** Una conversación guardada en el historial del asistente. */
export interface Conversation {
  id: string;
  /** Título legible, derivado del primer mensaje del usuario. */
  title: string;
  messages: Message[];
  /** Fecha de creación en formato ISO. */
  createdAt: string;
  /** Fecha del último mensaje en formato ISO. */
  updatedAt: string;
}

/**
 * Paleta del feature de chat.
 * Los hex provienen del diseño en Figma y no coinciden con los tokens de
 * `src/theme/` ni `src/constants/colors.ts`, por eso se definen aquí.
 */
export const chatColors = {
  background: '#F5F5F5',
  primary: '#3B5BDB',
  userBubble: '#1E3A5F',
  textPrimary: '#222222',
  textSecondary: '#555555',
  textAIResponse: '#333333',
  placeholder: '#999999',
  surface: '#FFFFFF',
} as const;
