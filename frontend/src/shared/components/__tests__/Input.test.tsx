import React from "react";
import { render } from "@testing-library/react-native";

import { Input } from "../Input";

describe("Suite - Input", () => {
  test("inputType='number' -> keyboardType numeric", () => {
    const { getByPlaceholderText } = render(
      <Input inputType="number" placeholder="num" />,
    );

    expect(getByPlaceholderText("num").props.keyboardType).toBe("numeric");
  });

  test("inputType='phone' -> keyboardType phone-pad", () => {
    const { getByPlaceholderText } = render(
      <Input inputType="phone" placeholder="tel" />,
    );

    expect(getByPlaceholderText("tel").props.keyboardType).toBe("phone-pad");
  });

  test("inputType='password' -> secureTextEntry true", () => {
    const { getByPlaceholderText } = render(
      <Input inputType="password" placeholder="pass" />,
    );

    expect(getByPlaceholderText("pass").props.secureTextEntry).toBe(true);
  });

  test("validation={isValid:false, message:'Correo inválido'} -> renderiza el mensaje de error", () => {
    const { getByText } = render(
      <Input
        placeholder="email"
        validation={{ isValid: false, message: "Correo inválido" }}
      />,
    );

    expect(getByText("Correo inválido")).toBeTruthy();
  });
});
