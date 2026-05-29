import React, { useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, RotateCw, SquarePen } from 'lucide-react-native';
import type { ChatScreenProps } from '@navigation/types';
import { useMapStore } from '@store/useMapStore';
import { getCampusPlaceById } from '@features/map/constants/unmsm';
import { useChat } from '../hooks/useChat';
import { chatColors, type LocationResult, type Message } from '../types';
import { ChatInput } from '../components/ChatInput';
import { MessageBubble } from '../components/MessageBubble';
import { AIResponse } from '../components/AIResponse';
import { LocationCard } from '../components/LocationCard';
import { SuggestionChips } from '../components/SuggestionChips';
import { TypingIndicator } from '../components/TypingIndicator';
import { ConversationHistory } from '../components/ConversationHistory';

const TITLE = '¿En qué puedo ayudarte hoy?';

const IDLE_PLACEHOLDER = 'Busca lugares o consulta horarios y oficinas.';
const ANSWERED_PLACEHOLDER =
  'Puedes preguntarle cualquier información sobre el campus.';

const SUGGESTIONS = [
  'Cómo llegar al auditorio Ela Dunbar Temple?',
  'Cómo llegar al Rectorado?',
  'Cómo llegar al Comedor Universitario?',
];

export function ChatScreen({ navigation }: ChatScreenProps): React.JSX.Element {
  const {
    messages,
    chatState,
    inputText,
    isLoading,
    onChangeText,
    sendMessage,
    retryMessage,
    resetChat,
  } = useChat();

  const listRef = useRef<FlatList<Message>>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const setFocusTarget = useMapStore((state) => state.setFocusTarget);

  function handleOpenLocation(location: LocationResult): void {
    const place = getCampusPlaceById(location.id);
    if (place) {
      setFocusTarget(place.coordinate);
    }
    navigation.navigate('Map');
  }

  function renderMessage({ item }: { item: Message }): React.JSX.Element {
    if (item.role === 'user') {
      return <MessageBubble content={item.content} />;
    }
    return (
      <View>
        <AIResponse content={item.content} />
        {item.locations?.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            onOpen={handleOpenLocation}
          />
        ))}
        {item.isError ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
            style={styles.retryButton}
            disabled={isLoading}
            onPress={() => retryMessage(item)}
          >
            <RotateCw color={chatColors.primary} size={16} strokeWidth={2} />
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const showResetButton = messages.length > 0 || chatState !== 'idle';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header: hamburguesa (historial) + nueva conversación */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver historial de conversaciones"
            hitSlop={10}
            onPress={() => setHistoryVisible(true)}
          >
            <Menu color={chatColors.textPrimary} size={26} strokeWidth={2} />
          </Pressable>

          {showResetButton ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nueva conversación"
              hitSlop={10}
              onPress={resetChat}
            >
              <SquarePen
                color={chatColors.textPrimary}
                size={24}
                strokeWidth={2}
              />
            </Pressable>
          ) : null}
        </View>

        {chatState === 'answered' ? (
          <>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={styles.flex}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onContentSizeChange={() =>
                listRef.current?.scrollToEnd({ animated: true })
              }
              ListFooterComponent={isLoading ? <TypingIndicator /> : null}
            />
            <View style={styles.inputDock}>
              <ChatInput
                value={inputText}
                onChangeText={onChangeText}
                onSend={sendMessage}
                placeholder={ANSWERED_PLACEHOLDER}
                isLoading={isLoading}
              />
            </View>
          </>
        ) : (
          <Pressable
            style={[
              styles.centerArea,
              chatState === 'asking' && styles.centerAreaAsking,
            ]}
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <Text style={styles.title}>{TITLE}</Text>

            <ChatInput
              value={inputText}
              onChangeText={onChangeText}
              onSend={sendMessage}
              placeholder={IDLE_PLACEHOLDER}
              isLoading={isLoading}
            />

            {chatState === 'idle' ? (
              <SuggestionChips
                suggestions={SUGGESTIONS}
                onSelect={onChangeText}
              />
            ) : null}
          </Pressable>
        )}
      </KeyboardAvoidingView>

      <ConversationHistory
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: chatColors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  centerAreaAsking: {
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  title: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 20,
    color: chatColors.textPrimary,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: chatColors.primary,
  },
  retryText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: chatColors.primary,
  },
  inputDock: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: chatColors.background,
  },
});
