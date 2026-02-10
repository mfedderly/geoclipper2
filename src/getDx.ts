import type { Point64 } from "./types.ts";

/**
 * @returns a double, but may also be Infinity or -Infinity in certain cases
 */
export function getDx(pt1: Point64, pt2: Point64): number {
  // Note: this is safe because dy is a double in clipper2
  const dy = pt2[1] - pt1[1];
  if (dy !== 0) {
    return (pt2[0] - pt1[0]) / dy;
  }
  return pt2[0] > pt1[0] ? -Infinity : Infinity;
}
