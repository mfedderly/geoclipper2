import type { PointD } from "./types.ts";

export function crossProductD(vec1: PointD, vec2: PointD): number {
  return vec1[1] * vec2[0] - vec2[1] * vec1[0];
}
