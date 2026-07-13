import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { WelcomeScreen } from "../WelcomeScreen";
import { useAuthStore } from "@store/useAuthStore";

const mockNavigation = { navigate: jest.fn() } as any;

describe("Suite 4 - WelcomeScreen", () => {
  const initialAuthState = useAuthStore.getState();

  beforeEach(() => {
    useAuthStore.setState(initialAuthState, true);
  });

  test("AUTH-08: 'Continuar como invitado' accede al Modo Libre sin cuenta", () => {
    const { getByText } = render(
      <WelcomeScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.press(getByText("Continuar como invitado"));

    expect(useAuthStore.getState().isGuest).toBe(true);
    expect(useAuthStore.getState().session).toBeNull();
  });

  test("'Iniciar sesión' navega a la pantalla 'Login'", () => {
    const { getByText } = render(
      <WelcomeScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.press(getByText("Iniciar sesión"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Login");
  });

  test("'Registrarse' navega a la pantalla 'Register'", () => {
    const { getByText } = render(
      <WelcomeScreen navigation={mockNavigation} route={{} as any} />,
    );

    fireEvent.press(getByText("Registrarse"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith("Register");
  });
});
