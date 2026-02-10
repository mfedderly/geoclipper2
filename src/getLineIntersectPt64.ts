import { pointDToPoint64 } from "./pointDToPoint64.ts";
import type { Point64, PointD } from "./types.ts";

// GetLineIntersectPt - a 'true' result is non-parallel. The 'ip' will also
// be constrained to seg1. However, it's possible that 'ip' won't be inside
// seg2, even when 'ip' hasn't been constrained (ie 'ip' is inside seg1).
export function getLineIntersectPt64(
  ln1a: Point64,
  ln1b: Point64,
  ln2a: Point64,
  ln2b: Point64,
): { nonParallel: boolean; ip: Point64 } {
  // this math is all safe, as the original clipper2 code uses doubles here
  const dy1 = ln1b[1] - ln1a[1];
  const dx1 = ln1b[0] - ln1a[0];
  const dy2 = ln2b[1] - ln2a[1];
  const dx2 = ln2b[0] - ln2a[0];
  const det = dy1 * dx2 - dy2 * dx1;

  if (det === 0.0) {
    return { nonParallel: false, ip: [0, 0] as Point64 };
  }

  // again this was originally doubles
  const t = ((ln1a[0] - ln2a[0]) * dy2 - (ln1a[1] - ln2a[1]) * dx2) / det;
  if (t <= 0.0) {
    // must copy ln1a (and ln1b below) because these are Point64's on existing structures
    // the original C# code uses ip = ln1a to assign them, but its sneakily a struct and therefore a copy not a reference.
    return { nonParallel: true, ip: Array.from(ln1a) as Point64 };
  } else if (t >= 1.0) {
    return { nonParallel: true, ip: Array.from(ln1b) as Point64 };
  } else {
    return {
      nonParallel: true,
      // avoid using constructor (and rounding too) as they affect performance //664
      ip: pointDToPoint64([ln1a[0] + t * dx1, ln1a[1] + t * dy1] as PointD),
    };
  }
}
