import { renderHook, act } from "@testing-library/react-native";

import { useMapCamera } from "../useMapCamera";
import { UNMSM } from "../../constants/unmsm";

describe("Suite 3 - useMapCamera", () => {
  test("MAP-04: render inicial -> cámara centrada en la UNMSM", () => {
    const { result } = renderHook(() => useMapCamera());

    expect(result.current.cameraConfig.centerCoordinate).toEqual([
      UNMSM.center.longitude,
      UNMSM.center.latitude,
    ]);
  });

  test("MAP-12: tap 'centrar' -> centerCoordinate = ubicación actual", () => {
    const { result } = renderHook(() => useMapCamera());
    const currentLocation: [number, number] = [-77.085, -12.058];

    act(() => {
      result.current.moveToPoint(currentLocation);
    });

    expect(result.current.cameraConfig.centerCoordinate).toEqual(
      currentLocation,
    );
  });

  test("goToDefaultMode() -> restaura centro, zoom, pitch, heading y duración por defecto de la UNMSM", () => {
    const { result } = renderHook(() => useMapCamera());
    const someCoord: [number, number] = [-77.09, -12.06];

    act(() => {
      result.current.goToFreeMode(someCoord);
    });

    act(() => {
      result.current.goToDefaultMode();
    });

    expect(result.current.cameraConfig).toMatchObject({
      centerCoordinate: [UNMSM.center.longitude, UNMSM.center.latitude],
      zoomLevel: UNMSM.camera.zoomLevel,
      pitch: UNMSM.camera.pitch,
      heading: 0,
      animationDuration: 2000,
    });
  });

  test("goToFreeMode(coord) -> centra en coord con zoom 21, pitch 80 y duración 2500", () => {
    const { result } = renderHook(() => useMapCamera());
    const coord: [number, number] = [-77.086, -12.055];

    act(() => {
      result.current.goToFreeMode(coord);
    });

    expect(result.current.cameraConfig).toMatchObject({
      centerCoordinate: coord,
      zoomLevel: 21,
      pitch: 80,
      animationDuration: 2500,
    });
  });

  test("goToRoutePreview(coord) -> centra en coord con zoom 17, pitch 40 y duración 1500", () => {
    const { result } = renderHook(() => useMapCamera());
    const coord: [number, number] = [-77.087, -12.057];

    act(() => {
      result.current.goToRoutePreview(coord);
    });

    expect(result.current.cameraConfig).toMatchObject({
      centerCoordinate: coord,
      zoomLevel: 17,
      pitch: 40,
      animationDuration: 1500,
    });
  });

  test("goToGuideMode(coord) -> centra en coord con zoom 18, pitch 60 y duración 2000", () => {
    const { result } = renderHook(() => useMapCamera());
    const coord: [number, number] = [-77.084, -12.059];

    act(() => {
      result.current.goToGuideMode(coord);
    });

    expect(result.current.cameraConfig).toMatchObject({
      centerCoordinate: coord,
      zoomLevel: 18,
      pitch: 60,
      animationDuration: 2000,
    });
  });

  test("setHeading(90) -> actualiza heading y duración a 500 preservando el resto del estado previo", () => {
    const { result } = renderHook(() => useMapCamera());
    const coord: [number, number] = [-77.086, -12.055];

    act(() => {
      result.current.goToFreeMode(coord);
    });

    act(() => {
      result.current.setHeading(90);
    });

    expect(result.current.cameraConfig).toMatchObject({
      centerCoordinate: coord,
      zoomLevel: 21,
      pitch: 80,
      heading: 90,
      animationDuration: 500,
    });
  });

  test("moveToPoint tras goToFreeMode -> cambia solo el centro, preserva zoom vía spread del estado previo", () => {
    const { result } = renderHook(() => useMapCamera());

    act(() => {
      result.current.goToFreeMode([-77.08, -12.05]);
    });

    act(() => {
      result.current.moveToPoint([-77.09, -12.06]);
    });

    expect(result.current.cameraConfig.centerCoordinate).toEqual([
      -77.09, -12.06,
    ]);
    expect(result.current.cameraConfig.zoomLevel).toBe(21);
  });
});
