import { primitive } from './colors';

/**
 * Tokens de color para el modo oscuro (dark mode).
 * Cada token referencia un primitivo de `colors.ts`.
 */
export const darkColors = {
  /** Fondo principal de la app */
  bg:               primitive.black,

  // — Botón primario —
  bgPrimaryBtn:     primitive.quinary,
  textPrimaryBtn:   primitive.white,
  strokePrimaryBtn: primitive.graphite,

  // — Botón secundario —
  bgSecondaryBtn:   primitive.onyx,
  textSecondaryBtn: primitive.white,

  // — Botón ghost —
  textGhostBtn:     primitive.gray,

  // — Botón link —
  textLinkBtn:      primitive.white,

  // — Tipografía —
  textH1:           primitive.white,
  textPrimaryP:     primitive.slate,
  textInfoP:        primitive.alabastarGrey,

  // — Contenedores / skeleton —
  bgSkeletonImg:    primitive.graphite,
  bgContainer:      primitive.graphite,

  // — Info / bordes —
  strokeInfo:       primitive.charcoal,

  // — Steps —
  stepEnable:       primitive.tertiary,
  stepDisable:      primitive.oliveBark,
} as const;

export type DarkColors = typeof darkColors;
