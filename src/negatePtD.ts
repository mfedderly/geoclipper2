import type { PointD } from "./types.ts";

export function negatePtD(pt: PointD): PointD {
  return [-pt[0], -pt[1]] as PointD;
}
