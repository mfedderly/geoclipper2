import type { PointD } from "./types.ts";

export function translatePoint(pt: PointD, dx: number, dy: number): PointD {
  return [pt[0] + dx, pt[1] + dy] as PointD;
}
