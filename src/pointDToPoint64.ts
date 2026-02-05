import type { Point64, PointD } from "./types.ts";

export function pointDToPoint64(pt: PointD): Point64 {
  // TODO we need to truncate from double to int here
  return [Math.trunc(pt[0]), Math.trunc(pt[1])] as Point64;
}
