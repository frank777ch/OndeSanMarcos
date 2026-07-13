import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

import { AuthHeader } from "../AuthHeader";

describe("Suite - AuthHeader", () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  test("sin prop onBack -> el botón usa navigation.goBack() como fallback", () => {
    const { getByLabelText } = render(<AuthHeader />);

    fireEvent.press(getByLabelText("Volver"));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
