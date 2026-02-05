import type { Point64 } from "./types.ts";

export function ptsReallyClose(pt1: Point64, pt2: Point64): boolean {
  return Math.abs(pt1[0] - pt2[0]) < 2 && Math.abs(pt1[1] - pt2[1]) < 2;
}
