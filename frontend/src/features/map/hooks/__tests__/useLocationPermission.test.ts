import { renderHook, waitFor } from "@testing-library/react-native";
import { Alert, Platform, ToastAndroid } from "react-native";
import * as Location from "expo-location";

import { useLocationPermission } from "../useLocationPermission";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 2, High: 4 },
}));

const mockedRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.Mock;
const mockedGetLastKnown = Location.getLastKnownPositionAsync as jest.Mock;
const mockedGetCurrentPosition =
  Location.getCurrentPositionAsync as jest.Mock;

/**
 * El hook agenda un `setTimeout(..., 10000)` real para el timeout del GPS.
 * Cuando `getCurrentPositionAsync` se deja pendiente a propósito (para
 * aislar otra rama), ese timer de 10s real quedaría colgado más allá del
 * test. Para mantener los tests deterministas y sin timers colgados,
 * interceptamos únicamente esa llamada puntual (ms === 10000) y dejamos
 * pasar cualquier otro `setTimeout` (usado internamente por React/RNTL) al
 * setTimeout real.
 */
async function withImmediateGpsTimeout<T>(run: () => Promise<T>): Promise<T> {
  const originalSetTimeout = global.setTimeout;
  (global as unknown as { setTimeout: unknown }).setTimeout = (
    callback: (...args: unknown[]) => void,
    ms?: number,
    ...args: unknown[]
  ) => {
    if (ms === 10000) {
      callback();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }
    return originalSetTimeout(callback as never, ms, ...(args as []));
  };
  try {
    return await run();
  } finally {
    global.setTimeout = originalSetTimeout;
  }
}

describe("Suite 3 - useLocationPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(ToastAndroid, "show").mockImplementation(() => {});
  });

  test("MAP-01: al montar, requestForegroundPermissionsAsync se llama una vez", async () => {
    mockedRequestPermissions.mockResolvedValue({ status: "granted" });
    mockedGetLastKnown.mockResolvedValue(null);
    mockedGetCurrentPosition.mockResolvedValue({
      coords: { latitude: -12.057, longitude: -77.085 },
    });

    renderHook(() => useLocationPermission());

    await waitFor(() =>
      expect(mockedRequestPermissions).toHaveBeenCalledTimes(1),
    );
  });

  test("MAP-02: status granted + coordenada en campus -> avatar visible", async () => {
    mockedRequestPermissions.mockResolvedValue({ status: "granted" });
    mockedGetLastKnown.mockResolvedValue(null);
    mockedGetCurrentPosition.mockResolvedValue({
      coords: { latitude: -12.057, longitude: -77.085 },
    });

    const { result } = renderHook(() => useLocationPermission());

    await waitFor(() => expect(result.current.showAvatar).toBe(true));
    expect(result.current.userLocation).toEqual([-77.085, -12.057]);
  });

  test("MAP-03: status denied -> se muestra advertencia y el mapa sigue usable", async () => {
    mockedRequestPermissions.mockResolvedValue({ status: "denied" });

    const { result } = renderHook(() => useLocationPermission());

    await waitFor(() => expect(mockedRequestPermissions).toHaveBeenCalled());
    await waitFor(() => {
      const warned =
        (Alert.alert as jest.Mock).mock.calls.length > 0 ||
        (ToastAndroid.show as jest.Mock).mock.calls.length > 0;
      expect(warned).toBe(true);
    });

    expect(result.current.showAvatar).toBe(false);
    expect(mockedGetCurrentPosition).not.toHaveBeenCalled();
  });

  test("MAP-04: Android + permiso denegado -> usa ToastAndroid.show y no Alert.alert", async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", {
      value: "android",
      configurable: true,
    });

    try {
      mockedRequestPermissions.mockResolvedValue({ status: "denied" });

      const { result } = renderHook(() => useLocationPermission());

      await waitFor(() => expect(ToastAndroid.show).toHaveBeenCalled());
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(result.current.showAvatar).toBe(false);
    } finally {
      Object.defineProperty(Platform, "OS", {
        value: originalOS,
        configurable: true,
      });
    }
  });

  test("MAP-05: lastKnown dentro del campus setea userLocation/showAvatar antes de resolver getCurrentPositionAsync", async () => {
    await withImmediateGpsTimeout(async () => {
      // getCurrentPositionAsync nunca resuelve, así que el timeout de GPS
      // también se dispara (console.warn); lo silenciamos porque no es lo
      // que este test verifica (ver MAP-06 para esa rama).
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      try {
        mockedRequestPermissions.mockResolvedValue({ status: "granted" });
        mockedGetLastKnown.mockResolvedValue({
          coords: { latitude: -12.057, longitude: -77.085 },
        });
        // Nunca resuelve: aísla el efecto de lastKnown del de getCurrentPositionAsync.
        mockedGetCurrentPosition.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useLocationPermission());

        await waitFor(() => expect(result.current.showAvatar).toBe(true));
        expect(result.current.userLocation).toEqual([-77.085, -12.057]);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  test("MAP-06: timeout de GPS (getCurrentPositionAsync no resuelve en 10s) -> console.warn y showAvatar sigue false", async () => {
    await withImmediateGpsTimeout(async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      try {
        mockedRequestPermissions.mockResolvedValue({ status: "granted" });
        mockedGetLastKnown.mockResolvedValue(null);
        mockedGetCurrentPosition.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useLocationPermission());

        await waitFor(() =>
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("GPS timeout"),
          ),
        );
        expect(result.current.showAvatar).toBe(false);
        expect(result.current.userLocation).toBeNull();
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  test("MAP-07: coordenada actual fuera del campus - comportamiento real observado: igual activa userLocation/showAvatar", async () => {
    // Comportamiento REAL del hook hoy (bloque `else`): no filtra por
    // geocerca, solo loguea con console.warn y de todas formas setea
    // userLocation/showAvatar=true. Este test documenta ese comportamiento
    // actual tal cual está, no lo que "debería" hacer.
    mockedRequestPermissions.mockResolvedValue({ status: "granted" });
    mockedGetLastKnown.mockResolvedValue(null);
    mockedGetCurrentPosition.mockResolvedValue({
      coords: { latitude: -12.12, longitude: -77.03 }, // Miraflores, fuera de CAMPUS_BOUNDS
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useLocationPermission());

    await waitFor(() => expect(result.current.showAvatar).toBe(true));
    expect(result.current.userLocation).toEqual([-77.03, -12.12]);
    expect(warnSpy).toHaveBeenCalledWith(
      "Usuario fuera, posicion actual: ",
      -12.12,
      -77.03,
    );

    warnSpy.mockRestore();
  });

  test("MAP-08: excepción en getCurrentPositionAsync se captura por el catch sin romper el hook", async () => {
    await withImmediateGpsTimeout(async () => {
      const gpsError = new Error("GPS error");
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        mockedRequestPermissions.mockResolvedValue({ status: "granted" });
        mockedGetLastKnown.mockResolvedValue(null);
        mockedGetCurrentPosition.mockRejectedValue(gpsError);

        const { result } = renderHook(() => useLocationPermission());

        await waitFor(() =>
          expect(errorSpy).toHaveBeenCalledWith(
            "Error obteniendo ubicación:",
            gpsError,
          ),
        );
        expect(result.current.showAvatar).toBe(false);
        expect(result.current.userLocation).toBeNull();
      } finally {
        errorSpy.mockRestore();
      }
    });
  });
});
