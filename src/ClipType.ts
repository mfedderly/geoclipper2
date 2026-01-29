export const ClipType = {
  NoClip: 0,
  Intersection: 1,
  Union: 2,
  Difference: 3,
  Xor: 4,
} as const;
export type ClipType = (typeof ClipType)[keyof typeof ClipType];
