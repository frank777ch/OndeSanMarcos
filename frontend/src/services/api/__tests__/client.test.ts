import { apiClient } from "../client";
import { Config } from "@constants/config";

describe("Suite - apiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test("API-01: get() exitoso devuelve el JSON parseado de la respuesta", async () => {
    const payload = { answer: "hola", locations: [] };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await apiClient.get("/algo");

    expect(result).toEqual(payload);
  });

  test("API-02: error HTTP (ok:false) rechaza con Error que incluye status y statusText", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({}),
    });

    await expect(apiClient.get("/algo")).rejects.toThrow(
      /404.*Not Found/,
    );
  });

  test("API-03: AbortError se traduce a mensaje de timeout con el valor configurado", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    (global.fetch as jest.Mock).mockRejectedValue(abortError);

    await expect(apiClient.get("/algo")).rejects.toThrow(
      `API timeout after ${Config.api.timeout}ms`,
    );
  });

  test("API-04: error de red genérico (no AbortError) se relanza tal cual", async () => {
    const networkError = new Error("Network request failed");
    (global.fetch as jest.Mock).mockRejectedValue(networkError);

    await expect(apiClient.get("/algo")).rejects.toThrow(
      "Network request failed",
    );
  });

  test("API-05: clearTimeout se llama tanto en éxito como en error, sin dejar el timer colgado", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await apiClient.get("/exito");
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

    clearTimeoutSpy.mockClear();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    await expect(apiClient.get("/error")).rejects.toThrow("boom");
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

    clearTimeoutSpy.mockRestore();
  });

  test("API-06: post() envía method POST y body serializado", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await apiClient.post("/api/chat", { query: "hola" });

    expect(global.fetch).toHaveBeenCalledWith(
      `${Config.api.baseUrl}/api/chat`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ query: "hola" }),
      }),
    );
  });
});
