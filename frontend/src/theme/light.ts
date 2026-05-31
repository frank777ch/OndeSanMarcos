import { primitive } from "./colors";

/**
 * Tokens de color para el modo claro (light mode).
 * Cada token referencia un primitivo de `colors.ts`.
 */
export const lightColors = {
  /** Fondo principal de la app */
  bg: primitive.white,

  // — Botón primario —
  bgPrimaryBtn: primitive.primary,
  textPrimaryBtn: primitive.white,
  strokePrimaryBtn: primitive.slate,

  // — Botón secundario —
  bgSecondaryBtn: primitive.stone,
  textSecondaryBtn: primitive.black,
  strokeSecondaryBtn: primitive.alabastarGrey,

  // — Botón ghost —
  textGhostBtn: primitive.charcoal,

  // — Botón link —
  textLinkBtn: primitive.black,

  // — Tipografía —
  textH1: primitive.black,
  textPrimaryP: primitive.charcoal,
  textInfoP: primitive.charcoal,

  // — Contenedores / skeleton —
  bgSkeletonImg: primitive.alabastarGrey,
  bgContainer: primitive.stone,

  // — Info / bordes —
  strokeInfo: primitive.silver,

  // — Steps —
  stepEnable: primitive.tertiary,
  stepDisable: primitive.softBlush,
} as const;

export type LightColors = typeof lightColors;
