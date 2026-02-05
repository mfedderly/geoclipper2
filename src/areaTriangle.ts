import type { Point64 } from "./types.ts";

export function areaTriangle(pt1: Point64, pt2: Point64, pt3: Point64) {
  // NOTE: in the original, this math is all done using doubles, and is therefore safe against overflow
  return (
    (pt3[1] + pt1[1]) * (pt3[0] - pt1[0]) +
    (pt1[1] + pt2[1]) * (pt1[0] - pt2[0]) +
    (pt2[1] + pt3[1]) * (pt2[0] - pt3[0])
  );
}
