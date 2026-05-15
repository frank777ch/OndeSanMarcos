/**
 * Primitive color tokens extraídos de Figma.
 * Estos son los valores base usados como referencia por los tokens de modo (light/dark).
 * No usar directamente en componentes — usar los tokens de modo en su lugar.
 */
export const primitive = {
  primary:       '#3056AC',
  ghostWhite:    '#EAEEF7',
  secondary:     '#E2A59F',
  tertiary:      '#F6C25B',
  oliveBark:     '#604C27',
  softBlush:     '#FDE6DE',
  quaternary:    '#FF8F10',
  quinary:       '#1C2D8A',
  white:         '#FFFFFF',
  black:         '#0A0A0A',
  gray:          '#AAAAAF',
  silver:        '#A3A3A3',
  alabastarGrey: '#DFDFDF',
  charcoal:      '#5E5E5E',
  stone:         '#F2F2F2',
  slate:         '#E6E6E6',
  carbon:        '#181818',
  onyx:          '#101010',
  graphite:      '#181818', // dark mode value; light mode: '#2F2F2F'
} as const;

export type PrimitiveColors = typeof primitive;
