import type { Point64 } from "./types.ts";

export function point64Equal(pt1: Point64, pt2: Point64) {
  return pt1[0] === pt2[0] && pt1[1] === pt2[1];
}
