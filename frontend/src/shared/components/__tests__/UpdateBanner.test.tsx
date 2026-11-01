import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { UpdateBanner } from "../UpdateBanner";
import type { ApkRelease } from "@shared/utils/appRelease";

const apk: ApkRelease = {
  versionCode: 9,
  tag: "app-v9",
  name: "OndeSanMarcos app-v9",
  notes: "",
  apkUrl: "https://github.com/x/y/releases/download/app-v9/ondesanmarcos.apk",
  pageUrl: "https://github.com/x/y/releases/tag/app-v9",
};

describe("UpdateBanner", () => {
  it("no muestra nada si no hay actualizaciones", () => {
    render(<UpdateBanner otaReady={false} onApplyOta={jest.fn()} apkRelease={null} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("ofrece reiniciar cuando la OTA está lista", () => {
    const onApplyOta = jest.fn();
    render(<UpdateBanner otaReady onApplyOta={onApplyOta} apkRelease={null} />);
    fireEvent.press(screen.getByLabelText("Reiniciar"));
    expect(onApplyOta).toHaveBeenCalled();
  });

  it("prioriza el APK nuevo y abre su enlace de descarga", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    render(<UpdateBanner otaReady onApplyOta={jest.fn()} apkRelease={apk} />);
    expect(screen.queryByLabelText("Reiniciar")).toBeNull();
    fireEvent.press(screen.getByLabelText("Descargar"));
    expect(openURL).toHaveBeenCalledWith(apk.apkUrl);
  });

  it("se puede cerrar", () => {
    render(<UpdateBanner otaReady onApplyOta={jest.fn()} apkRelease={null} />);
    fireEvent.press(screen.getByLabelText("Cerrar aviso"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
