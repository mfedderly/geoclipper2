export const VertexFlags = {
  None: 0,
  OpenStart: 1,
  OpenEnd: 2,
  LocalMax: 4,
  LocalMin: 8,
} as const;
export type VertexFlags = number;
