jest.mock("../client", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

import { supabase } from "../client";
import { authService } from "../auth.service";

describe("Suite 4 - authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("signIn: credenciales inválidas -> rechaza con el error de supabase", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error("Invalid credentials"),
    });

    await expect(
      authService.signIn("juan@unmsm.edu.pe", "wrong-pass"),
    ).rejects.toThrow("Invalid credentials");
  });

  test("signIn: credenciales válidas -> resuelve con el data de supabase", async () => {
    const data = { session: { access_token: "tok" } };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data,
      error: null,
    });

    await expect(
      authService.signIn("juan@unmsm.edu.pe", "correct-pass"),
    ).resolves.toBe(data);
  });

  test("signUp: error de supabase -> rechaza con ese error", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error("Email already registered"),
    });

    await expect(
      authService.signUp("juan@unmsm.edu.pe", "pass123", "Juan"),
    ).rejects.toThrow("Email already registered");
  });

  test("signUp: éxito -> resuelve con el data de supabase y llama con los parámetros correctos", async () => {
    const data = { user: { id: "user-1" } };
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data,
      error: null,
    });

    await expect(
      authService.signUp("juan@unmsm.edu.pe", "pass123", "Juan"),
    ).resolves.toBe(data);

    expect(supabase.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "juan@unmsm.edu.pe",
        password: "pass123",
        options: expect.objectContaining({
          data: { name: "Juan" },
        }),
      }),
    );
  });

  test("signOut: error de supabase -> lanza", async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: new Error("boom"),
    });

    await expect(authService.signOut()).rejects.toThrow("boom");
  });

  test("signOut: sin error -> no lanza", async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    await expect(authService.signOut()).resolves.not.toThrow();
  });

  test("getSession: error de supabase -> lanza aunque haya session en data", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: new Error("x"),
    });

    await expect(authService.getSession()).rejects.toThrow("x");
  });

  test("getSession: éxito -> devuelve data.session, no el objeto data completo", async () => {
    const session = { access_token: "tok", user: { id: "user-1" } };
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session },
      error: null,
    });

    await expect(authService.getSession()).resolves.toBe(session);
  });

  test("onAuthStateChange: delega el callback recibido a supabase.auth.onAuthStateChange", () => {
    const callback = jest.fn();

    authService.onAuthStateChange(callback);

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
  });
});
