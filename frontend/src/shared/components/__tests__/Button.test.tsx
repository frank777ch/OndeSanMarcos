import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { Button } from "../Button";

describe("Suite - Button", () => {
  test("disabled=true -> onPress no se invoca al presionar", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button text="Guardar" onPress={onPress} disabled />,
    );

    fireEvent.press(getByText("Guardar"));

    expect(onPress).not.toHaveBeenCalled();
  });
});
