export const JoinWith = {
  None: 0,
  Left: 1,
  Right: 2,
} as const;
export type JoinWith = (typeof JoinWith)[keyof typeof JoinWith];
