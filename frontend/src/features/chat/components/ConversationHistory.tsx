import React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageSquare, SquarePen, Trash2, X } from "lucide-react-native";
import { useChatStore } from "@store/useChatStore";
import { chatColors, type Conversation } from "../types";
import { lightColors } from "@/theme/light";
import { useThemeStore } from "@/core/store/useThemeStore";

interface ConversationHistoryProps {
  visible: boolean;
  onClose: () => void;
}

/** Formatea una fecha ISO como "Hoy", "Ayer" o `dd/mm/aaaa`. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";

  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Panel lateral con el historial de conversaciones del asistente. */
export function ConversationHistory({
  visible,
  onClose,
}: ConversationHistoryProps): React.JSX.Element {
  const conversations = useChatStore((state) => state.conversations);
  const activeId = useChatStore((state) => state.activeId);
  const hasHydrated = useChatStore((state) => state.hasHydrated);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const startNewConversation = useChatStore(
    (state) => state.startNewConversation,
  );
  const primaryColor = useThemeStore((s) => s.primaryColor);

  function handleSelect(id: string): void {
    selectConversation(id);
    onClose();
  }

  function handleNew(): void {
    startNewConversation();
    onClose();
  }

  function renderItem({ item }: { item: Conversation }): React.JSX.Element {
    const isActive = item.id === activeId;
    return (
      <View
        style={[
          styles.item,
          isActive && { borderWidth: 1, borderColor: primaryColor },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          style={styles.itemMain}
          onPress={() => handleSelect(item.id)}
        >
          <MessageSquare
            color={isActive ? primaryColor : chatColors.textSecondary}
            size={18}
            strokeWidth={2}
          />
          <View style={styles.itemText}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.itemDate}>{formatDate(item.updatedAt)}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${item.title}`}
          hitSlop={8}
          style={styles.deleteButton}
          onPress={() => deleteConversation(item.id)}
        >
          <Trash2 color={chatColors.textSecondary} size={18} strokeWidth={2} />
        </Pressable>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.panel}>
          <SafeAreaView style={styles.panelInner} edges={["top", "bottom"]}>
            <View style={styles.header}>
              <Text style={styles.title}>Conversaciones</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={10}
                onPress={onClose}
              >
                <X color={chatColors.textPrimary} size={24} strokeWidth={2} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              style={[styles.newButton, { backgroundColor: primaryColor }]}
              onPress={handleNew}
            >
              <SquarePen color={chatColors.surface} size={18} strokeWidth={2} />
              <Text style={styles.newButtonText}>Nueva conversación</Text>
            </Pressable>

            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                hasHydrated ? (
                  <Text style={styles.empty}>
                    Aún no tienes conversaciones guardadas.
                  </Text>
                ) : null
              }
            />
          </SafeAreaView>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar historial"
          style={styles.backdrop}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  panel: {
    width: "82%",
    maxWidth: 340,
    backgroundColor: chatColors.background,
  },
  panelInner: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  title: {
    fontFamily: "FunnelDisplay_600SemiBold",
    fontSize: 18,
    color: chatColors.textPrimary,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: lightColors.bgPrimaryBtn,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  newButtonText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: chatColors.surface,
  },
  listContent: {
    paddingVertical: 8,
    gap: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: chatColors.surface,
    borderRadius: 12,
    paddingRight: 8,
  },
  itemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: chatColors.textPrimary,
  },
  itemDate: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: chatColors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  empty: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: chatColors.textSecondary,
    textAlign: "center",
    paddingVertical: 24,
  },
});
