import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock("@services/supabase/auth.service", () => ({
  authService: { signUp: jest.fn() },
}));

import { authService } from "@services/supabase/auth.service";
import { RegisterScreen } from "../RegisterScreen";

const mockNavigation = { navigate: jest.fn() } as any;

describe("Suite 4 - RegisterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("AUTH-09: registro con campos vacíos -> la validación bloquea el envío", async () => {
    const { getByText } = render(
      <RegisterScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.press(getByText("Registrar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Completa todos los campos",
      ),
    );
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  test("registro exitoso -> navega a EmailSent y no muestra Alert", async () => {
    (authService.signUp as jest.Mock).mockResolvedValue({});

    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.changeText(getByPlaceholderText("Ejem. Juan"), "Juan Perez");
    fireEvent.changeText(
      getByPlaceholderText("Ejem. juan@example.com"),
      "juan@unmsm.edu.pe",
    );
    fireEvent.changeText(getByPlaceholderText("********"), "pass1234");
    fireEvent.press(getByText("Registrar"));

    await waitFor(() =>
      expect(mockNavigation.navigate).toHaveBeenCalledWith("EmailSent", {
        email: "juan@unmsm.edu.pe",
      }),
    );
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test("registro fallido con Error -> muestra el mensaje del error y no navega a EmailSent", async () => {
    (authService.signUp as jest.Mock).mockRejectedValue(
      new Error("Correo ya registrado"),
    );

    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.changeText(getByPlaceholderText("Ejem. Juan"), "Juan Perez");
    fireEvent.changeText(
      getByPlaceholderText("Ejem. juan@example.com"),
      "juan@unmsm.edu.pe",
    );
    fireEvent.changeText(getByPlaceholderText("********"), "pass1234");
    fireEvent.press(getByText("Registrar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Correo ya registrado",
      ),
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalledWith(
      "EmailSent",
      expect.anything(),
    );
  });

  test("registro fallido con rechazo no-Error -> muestra el mensaje genérico de fallback", async () => {
    (authService.signUp as jest.Mock).mockRejectedValue("fail");

    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.changeText(getByPlaceholderText("Ejem. Juan"), "Juan Perez");
    fireEvent.changeText(
      getByPlaceholderText("Ejem. juan@example.com"),
      "juan@unmsm.edu.pe",
    );
    fireEvent.changeText(getByPlaceholderText("********"), "pass1234");
    fireEvent.press(getByText("Registrar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Error al registrarse",
      ),
    );
  });

  test("nombre solo con espacios -> la validación bloquea el envío igual que campos vacíos", async () => {
    const { getByText, getByPlaceholderText } = render(
      <RegisterScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.changeText(getByPlaceholderText("Ejem. Juan"), "   ");
    fireEvent.changeText(
      getByPlaceholderText("Ejem. juan@example.com"),
      "juan@unmsm.edu.pe",
    );
    fireEvent.changeText(getByPlaceholderText("********"), "pass1234");
    fireEvent.press(getByText("Registrar"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Completa todos los campos",
      ),
    );
    expect(authService.signUp).not.toHaveBeenCalled();
  });
});
