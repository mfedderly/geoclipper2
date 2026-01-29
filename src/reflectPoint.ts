import type { PointD } from "./types.ts";

export function reflectPoint(pt: PointD, pivot: PointD): PointD {
  return [
    pivot[0] + (pivot[0] - pt[0]),
    pivot[1] + (pivot[1] - pt[1]),
  ] as PointD;
}
