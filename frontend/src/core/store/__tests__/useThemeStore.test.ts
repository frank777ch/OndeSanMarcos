import { useThemeStore } from "../useThemeStore";
import { primitive } from "@/theme/colors";

describe("Suite - useThemeStore", () => {
  const initialState = useThemeStore.getState();

  beforeEach(() => {
    useThemeStore.setState(initialState, true);
  });

  test("valor por defecto: primaryColor es primitive.primary sin ninguna acción previa", () => {
    expect(useThemeStore.getState().primaryColor).toBe(primitive.primary);
  });

  test("setPrimaryColor('#123456') cambia primaryColor a ese valor exacto", () => {
    useThemeStore.getState().setPrimaryColor("#123456");

    expect(useThemeStore.getState().primaryColor).toBe("#123456");
  });
});
