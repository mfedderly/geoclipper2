import type { Point64, PointD } from "./types.ts";

export function getUnitNormal(pt1: Point64, pt2: Point64): PointD {
  // NOTE: this should be fine from a precision standpoint, we are intentionally going from Point64's to a PointD
  let dx = pt2[0] - pt1[0];
  let dy = pt2[1] - pt1[1];
  if (dx === 0 && dy === 0) {
    return [0, 0] as PointD;
  }

  const f = 1.0 / Math.sqrt(dx * dx + dy * dy);
  dx *= f;
  dy *= f;
  return [dy, -dx] as PointD;
}
