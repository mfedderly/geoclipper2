import type { PointD } from "./types.ts";

export function dotProductD(vec1: PointD, vec2: PointD): number {
  return vec1[0] * vec2[0] + vec1[1] * vec2[1];
}
