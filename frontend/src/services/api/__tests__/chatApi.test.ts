import { sendChatQuery } from "../chatApi";
import { apiClient } from "../client";

jest.mock("../client", () => ({
  apiClient: { post: jest.fn() },
}));

const mockedPost = apiClient.post as jest.Mock;

describe("Suite - sendChatQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("CHAT-01: normaliza la respuesta snake_case del backend a camelCase", async () => {
    const destination = { latitude: -12.057, longitude: -77.085 };
    mockedPost.mockResolvedValue({
      answer: "La biblioteca está abierta",
      locations: [{ id: "1", name: "Biblioteca" }],
      draw_route: true,
      destination,
    });

    const result = await sendChatQuery("¿dónde está la biblioteca?");

    expect(result).toEqual({
      answer: "La biblioteca está abierta",
      locations: [{ id: "1", name: "Biblioteca" }],
      drawRoute: true,
      destination,
    });
    expect(mockedPost).toHaveBeenCalledWith("/api/chat", {
      query: "¿dónde está la biblioteca?",
    });
  });

  test("CHAT-02: aplica valores por defecto cuando el backend omite locations/draw_route/destination", async () => {
    mockedPost.mockResolvedValue({
      answer: "x",
      locations: undefined,
      draw_route: undefined,
      destination: undefined,
    });

    const result = await sendChatQuery("query");

    expect(result).toEqual({
      answer: "x",
      locations: [],
      drawRoute: false,
      destination: null,
    });
  });
});
