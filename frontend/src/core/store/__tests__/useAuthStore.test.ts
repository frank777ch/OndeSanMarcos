import type { Session } from "@supabase/supabase-js";

import { useAuthStore } from "../useAuthStore";

describe("Suite 4 - useAuthStore", () => {
  const initialState = useAuthStore.getState();

  beforeEach(() => {
    useAuthStore.setState(initialState, true);
  });

  test("AUTH-07: login con credenciales válidas (mock) establece la sesión en el store", () => {
    const mockSession = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "user-1", email: "juan@unmsm.edu.pe" },
    } as unknown as Session;

    useAuthStore.getState().setSession(mockSession);

    expect(useAuthStore.getState().session).toBe(mockSession);
    expect(useAuthStore.getState().user).toEqual(mockSession.user);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test("clear: tras tener sesión y modo invitado, resetea todo el estado", () => {
    const mockSession = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "user-1", email: "juan@unmsm.edu.pe" },
    } as unknown as Session;

    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().setGuest(true);

    useAuthStore.getState().clear();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isGuest).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  test("setSession(null): logout deja user y session en null", () => {
    const mockSession = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "user-1", email: "juan@unmsm.edu.pe" },
    } as unknown as Session;

    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().setSession(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  test("setGuest(true): activa isGuest y también resetea isLoading", () => {
    useAuthStore.getState().setGuest(true);

    const state = useAuthStore.getState();
    expect(state.isGuest).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  test("setLoading: cambia solo isLoading, sin tocar user/session/isGuest", () => {
    useAuthStore.getState().setLoading(true);
    let state = useAuthStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isGuest).toBe(false);

    useAuthStore.getState().setLoading(false);
    state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isGuest).toBe(false);
  });
});
