export const FillRule = {
  EvenOdd: 0,
  NonZero: 1,
  Positive: 2,
  Negative: 3,
} as const;
export type FillRule = (typeof FillRule)[keyof typeof FillRule];
