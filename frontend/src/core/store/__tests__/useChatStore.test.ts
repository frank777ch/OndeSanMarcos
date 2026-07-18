import AsyncStorage from "@react-native-async-storage/async-storage";
import { waitFor } from "@testing-library/react-native";
import type { Message } from "@features/chat/types";

import { useChatStore, selectActiveMessages } from "../useChatStore";

describe("Suite 4 - useChatStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useChatStore.setState({
      conversations: [],
      activeId: null,
      chatState: "idle",
      inputText: "",
      isLoading: false,
    });
    await waitFor(() =>
      expect(useChatStore.getState().hasHydrated).toBe(true),
    );
  });

  test("AUTH-12: guardar 2 mensajes de chat -> al releer, historial intacto", async () => {
    const msg1: Message = {
      id: "m1",
      role: "user",
      content: "¿Dónde está la biblioteca?",
      timestamp: new Date("2026-07-11T10:00:00Z"),
    };
    const msg2: Message = {
      id: "m2",
      role: "assistant",
      content: "La biblioteca central está cerca de la puerta 3.",
      timestamp: new Date("2026-07-11T10:00:05Z"),
    };

    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().addMessage(msg2);

    const messages = selectActiveMessages(useChatStore.getState());
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe(msg1.content);
    expect(messages[1].content).toBe(msg2.content);

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem("osm-chat-conversations");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.state.conversations[0].messages).toHaveLength(2);
    });
  });

  test("removeMessage: elimina solo el mensaje indicado de la conversación activa", () => {
    const msg1: Message = {
      id: "m1",
      role: "user",
      content: "Primer mensaje",
      timestamp: new Date("2026-07-11T10:00:00Z"),
    };
    const msg2: Message = {
      id: "m2",
      role: "assistant",
      content: "Segundo mensaje",
      timestamp: new Date("2026-07-11T10:00:05Z"),
    };

    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().addMessage(msg2);
    useChatStore.getState().removeMessage("m1");

    const messages = selectActiveMessages(useChatStore.getState());
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe("m2");
  });

  test("removeMessage: no afecta a una conversación distinta de la activa", () => {
    const otherMsg: Message = {
      id: "other-1",
      role: "user",
      content: "Mensaje de otra conversación",
      timestamp: new Date("2026-07-11T09:00:00Z"),
    };
    const activeMsg: Message = {
      id: "active-1",
      role: "user",
      content: "Mensaje activo",
      timestamp: new Date("2026-07-11T11:00:00Z"),
    };

    // Crea la primera conversación y la deja inactiva iniciando una nueva.
    useChatStore.getState().addMessage(otherMsg);
    const otherConversationId = useChatStore.getState().activeId as string;
    useChatStore.getState().startNewConversation();

    // Crea la segunda conversación, que queda activa.
    useChatStore.getState().addMessage(activeMsg);

    useChatStore.getState().removeMessage("other-1");

    const otherConversation = useChatStore
      .getState()
      .conversations.find((conversation) => conversation.id === otherConversationId);
    expect(otherConversation?.messages).toHaveLength(1);
    expect(otherConversation?.messages[0].id).toBe("other-1");
  });

  test("startNewConversation: resetea el estado transitorio pero conserva el historial", () => {
    const msg: Message = {
      id: "m1",
      role: "user",
      content: "Hola",
      timestamp: new Date("2026-07-11T10:00:00Z"),
    };
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().activeId).not.toBeNull();

    useChatStore.getState().startNewConversation();

    const state = useChatStore.getState();
    expect(state.activeId).toBeNull();
    expect(state.chatState).toBe("idle");
    expect(state.inputText).toBe("");
    expect(state.isLoading).toBe(false);
    expect(state.conversations).toHaveLength(1);
  });

  test("selectConversation: activa la conversación indicada y reinicia estado transitorio", () => {
    useChatStore.getState().addMessage({
      id: "m1",
      role: "user",
      content: "Primera conversación",
      timestamp: new Date("2026-07-11T10:00:00Z"),
    });
    useChatStore.getState().startNewConversation();
    useChatStore.getState().addMessage({
      id: "m2",
      role: "user",
      content: "Segunda conversación",
      timestamp: new Date("2026-07-11T11:00:00Z"),
    });

    const [second, first] = useChatStore.getState().conversations;
    expect(second.messages[0].content).toBe("Segunda conversación");
    expect(first.messages[0].content).toBe("Primera conversación");

    useChatStore.getState().setInputText("borrador sin enviar");
    useChatStore.getState().selectConversation(first.id);

    const state = useChatStore.getState();
    expect(state.activeId).toBe(first.id);
    expect(state.chatState).toBe("answered");
    expect(state.inputText).toBe("");
  });

  test("deleteConversation: al borrar la conversación activa, activeId y chatState se reinician", () => {
    useChatStore.getState().addMessage({
      id: "m1",
      role: "user",
      content: "Conversación a borrar",
      timestamp: new Date("2026-07-11T10:00:00Z"),
    });
    const activeConversationId = useChatStore.getState().activeId as string;
    useChatStore.getState().setChatState("answered");

    useChatStore.getState().deleteConversation(activeConversationId);

    const state = useChatStore.getState();
    expect(state.activeId).toBeNull();
    expect(state.chatState).toBe("idle");
    expect(state.conversations).toHaveLength(0);
  });

  test("deleteConversation: al borrar una conversación NO activa, activeId y chatState no cambian", () => {
    useChatStore.getState().addMessage({
      id: "m1",
      role: "user",
      content: "Conversación inactiva",
      timestamp: new Date("2026-07-11T10:00:00Z"),
    });
    const inactiveConversationId = useChatStore.getState().activeId as string;
    useChatStore.getState().startNewConversation();
    useChatStore.getState().addMessage({
      id: "m2",
      role: "user",
      content: "Conversación activa",
      timestamp: new Date("2026-07-11T11:00:00Z"),
    });
    const activeConversationId = useChatStore.getState().activeId as string;
    useChatStore.getState().setChatState("answered");

    useChatStore.getState().deleteConversation(inactiveConversationId);

    const state = useChatStore.getState();
    expect(state.activeId).toBe(activeConversationId);
    expect(state.chatState).toBe("answered");
    expect(state.conversations).toHaveLength(1);
  });

  test("addMessage: sin conversación activa y primer mensaje del asistente -> título por defecto 'Conversación'", () => {
    useChatStore.getState().addMessage({
      id: "m1",
      role: "assistant",
      content: "Mensaje inicial del asistente",
      timestamp: new Date("2026-07-11T10:00:00Z"),
    });

    const conversation = useChatStore.getState().conversations[0];
    expect(conversation.title).toBe("Conversación");
  });

  test("addMessage: título derivado se trunca a 42 caracteres + '…' cuando el contenido es más largo", () => {
    const longContent =
      "Este es un mensaje de usuario bastante largo que supera los cuarenta y dos caracteres permitidos";
    useChatStore.getState().addMessage({
      id: "m1",
      role: "user",
      content: longContent,
      timestamp: new Date("2026-07-11T10:00:00Z"),
    });

    const conversation = useChatStore.getState().conversations[0];
    expect(conversation.title).toBe(`${longContent.slice(0, 42)}…`);
    expect(conversation.title.length).toBe(43);
  });

  test("setInputText: cambia solo inputText", () => {
    useChatStore.getState().setInputText("hola mundo");

    const state = useChatStore.getState();
    expect(state.inputText).toBe("hola mundo");
    expect(state.conversations).toHaveLength(0);
    expect(state.activeId).toBeNull();
  });

  test("setChatState: cambia solo chatState", () => {
    useChatStore.getState().setChatState("asking");

    const state = useChatStore.getState();
    expect(state.chatState).toBe("asking");
    expect(state.conversations).toHaveLength(0);
    expect(state.activeId).toBeNull();
  });

  test("setLoading: cambia solo isLoading", () => {
    useChatStore.getState().setLoading(true);

    const state = useChatStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.conversations).toHaveLength(0);
    expect(state.activeId).toBeNull();
  });
});
