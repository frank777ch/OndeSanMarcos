import { CAMPUS_BOUNDS, isInsideCampus } from "../geofence";

describe("Suite 3 - geofence", () => {
  test("MAP-06: coordenada interior del campus -> true", () => {
    expect(isInsideCampus(-12.057, -77.085)).toBe(true);
  });

  test("MAP-07: coordenada de otro distrito (Miraflores) -> false", () => {
    expect(isInsideCampus(-12.12, -77.03)).toBe(false);
  });

  test("MAP-08: coordenada en el límite del campus -> inclusiva y determinista", () => {
    const corners: [number, number][] = [
      [CAMPUS_BOUNDS.latMin, CAMPUS_BOUNDS.lngMin],
      [CAMPUS_BOUNDS.latMax, CAMPUS_BOUNDS.lngMax],
    ];

    for (const [lat, lng] of corners) {
      expect(isInsideCampus(lat, lng)).toBe(true);
      // Determinista: la misma entrada produce siempre el mismo resultado.
      expect(isInsideCampus(lat, lng)).toBe(isInsideCampus(lat, lng));
    }
  });

  test("las otras dos esquinas del bounding box también son inclusivas -> true", () => {
    expect(isInsideCampus(CAMPUS_BOUNDS.latMin, CAMPUS_BOUNDS.lngMax)).toBe(
      true,
    );
    expect(isInsideCampus(CAMPUS_BOUNDS.latMax, CAMPUS_BOUNDS.lngMin)).toBe(
      true,
    );
  });

  test("justo fuera de cada uno de los 4 bordes -> false", () => {
    const EPSILON = 0.0001;
    const midLat = (CAMPUS_BOUNDS.latMin + CAMPUS_BOUNDS.latMax) / 2;
    const midLng = (CAMPUS_BOUNDS.lngMin + CAMPUS_BOUNDS.lngMax) / 2;

    const casesOutside: [number, number][] = [
      [CAMPUS_BOUNDS.latMin - EPSILON, midLng], // debajo de latMin
      [CAMPUS_BOUNDS.latMax + EPSILON, midLng], // encima de latMax
      [midLat, CAMPUS_BOUNDS.lngMin - EPSILON], // a la izquierda de lngMin
      [midLat, CAMPUS_BOUNDS.lngMax + EPSILON], // a la derecha de lngMax
    ];

    for (const [lat, lng] of casesOutside) {
      expect(isInsideCampus(lat, lng)).toBe(false);
    }
  });

  test("NaN en lat/lng -> false, sin lanzar excepción", () => {
    expect(() => isInsideCampus(NaN, NaN)).not.toThrow();
    expect(isInsideCampus(NaN, NaN)).toBe(false);
  });

  test("coordenadas fuera del rango del mundo real -> false, sin lanzar excepción", () => {
    expect(() => isInsideCampus(200, -500)).not.toThrow();
    expect(isInsideCampus(200, -500)).toBe(false);
  });
});
