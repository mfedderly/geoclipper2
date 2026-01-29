import type { Point64, PointD } from "./types.ts";

export function pointDToPoint64(pt: PointD): Point64 {
  // TODO we need to truncate from double to int here
  return [pt[0], pt[1]] as Point64;
}
