import type { Point64, PointD } from "./types.ts";

/**
 * @returns true if the x and y coordinates are exactly the same
 */
export function pointEqual<T extends Point64 | PointD>(pt1: T, pt2: T) {
  return pt1[0] === pt2[0] && pt1[1] === pt2[1];
}
