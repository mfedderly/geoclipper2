export const EndType = {
  Polygon: 0,
  Joined: 1,
  Butt: 2,
  Square: 3,
  Round: 4,
} as const;

export type EndType = (typeof EndType)[keyof typeof EndType];
