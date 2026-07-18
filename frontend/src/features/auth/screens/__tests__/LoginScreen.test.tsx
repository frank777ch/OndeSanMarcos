import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock("@services/supabase/auth.service", () => ({
  authService: { signIn: jest.fn() },
}));

import { authService } from "@services/supabase/auth.service";
import { LoginScreen } from "../LoginScreen";
import { useAuthStore } from "@store/useAuthStore";

const mockNavigation = { navigate: jest.fn() } as any;

describe("Suite 4 - LoginScreen", () => {
  const initialAuthState = useAuthStore.getState();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState(initialAuthState, true);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("AUTH-05: login con cuenta inactiva -> error 'Cuenta inactiva'", async () => {
    (authService.signIn as jest.Mock).mockRejectedValue(
      new Error("Cuenta inactiva"),
    );

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.changeText(
      getByPlaceholderText("Ejem. juan@example.com"),
      "inactivo@unmsm.edu.pe",
    );
    fireEvent.changeText(getByPlaceholderText("********"), "Segura123");
    fireEvent.press(getByText("Iniciar sesión"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Cuenta inactiva"),
    );
    expect(useAuthStore.getState().session).toBeNull();
  });

  test("AUTH-06: login con contraseña errónea (mock) -> error controlado, sin sesión", async () => {
    (authService.signIn as jest.Mock).mockRejectedValue(
      new Error("Invalid login credentials"),
    );

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.changeText(
      getByPlaceholderText("Ejem. juan@example.com"),
      "juan@unmsm.edu.pe",
    );
    fireEvent.changeText(getByPlaceholderText("********"), "wrong-password");
    fireEvent.press(getByText("Iniciar sesión"));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Invalid login credentials",
      ),
    );
    expect(useAuthStore.getState().session).toBeNull();
  });

  test("campos vacíos -> alerta de validación y authService.signIn NO es llamado", () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.press(getByText("Iniciar sesión"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Completa todos los campos",
    );
    expect(authService.signIn).not.toHaveBeenCalled();
  });

  test("botón de volver del AuthHeader navega a 'Welcome'", () => {
    const { getByLabelText } = render(
      <LoginScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.press(getByLabelText("Volver"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Welcome");
  });
});
