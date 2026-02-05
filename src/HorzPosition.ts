export const HorzPosition = {
  Bottom: 0,
  Middle: 1,
  Top: 2,
} as const;
export type HorzPosition = (typeof HorzPosition)[keyof typeof HorzPosition];
