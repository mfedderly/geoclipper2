export const JoinType = {
  Miter: 0,
  Square: 1,
  Bevel: 2,
  Round: 3,
} as const;

export type JoinType = (typeof JoinType)[keyof typeof JoinType];
