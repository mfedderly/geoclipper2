import { sqr } from "./sqr.ts";
import type { Point64 } from "./types.ts";

export function perpendicDistFromLineSqrd64(
  pt: Point64,
  line1: Point64,
  line2: Point64,
) {
  // NOTE this entire method originally operates on doubles, and is therefore safe against SAFE_INTEGER overflows
  const a = pt[0] - line1[0];
  const b = pt[1] - line1[1];
  const c = line2[0] - line1[0];
  const d = line2[1] - line1[1];

  if (c === 0 && d === 0) {
    return 0;
  }

  return sqr(a * d - c * b) / (c * c + d * d);
}
