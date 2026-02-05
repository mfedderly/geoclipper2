export const PathType = {
  Subject: 0,
  Clip: 1,
} as const;
export type PathType = (typeof PathType)[keyof typeof PathType];
