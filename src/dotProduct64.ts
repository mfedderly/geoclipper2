import type { Point64 } from "./types.ts";

export function dotProduct64(pt1: Point64, pt2: Point64, pt3: Point64) {
  // NOTE: the original source uses double here, so we can safely run this dot product without running into overflows
  // typecast to double to avoid potential int overflow
  return (
    (pt2[0] - pt1[0]) * (pt3[0] - pt2[0]) +
    (pt2[1] - pt1[1]) * (pt3[1] - pt2[1])
  );
}
