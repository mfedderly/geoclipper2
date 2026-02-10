import type { PointD } from "./types.ts";

export function getLineIntersectPtD(
  ln1a: PointD,
  ln1b: PointD,
  ln2a: PointD,
  ln2b: PointD,
): { ip: PointD; nonParallel: boolean } {
  const dy1 = ln1b[1] - ln1a[1];
  const dx1 = ln1b[0] - ln1a[0];
  const dy2 = ln2b[1] - ln2a[1];
  const dx2 = ln2b[0] - ln2a[0];
  const det = dy1 * dx2 - dy2 * dx1;
  if (det === 0.0) {
    return { ip: [0, 0] as PointD, nonParallel: false };
  }

  let ip: PointD;
  const t = ((ln1a[0] - ln2a[0]) * dy2 - (ln1a[1] - ln2a[1]) * dx2) / det;
  if (t <= 0.0) {
    // ln1a (and ln1b below) must be cloned before returning, so we don't accidentally
    // reuse an point stored on existing data.
    ip = Array.from(ln1a) as PointD;
  } else if (t >= 1.0) {
    ip = Array.from(ln1b) as PointD;
  } else {
    // avoid using constructor (and rounding too) as they affect performance // 664
    ip = [ln1a[0] + t * dx1, ln1a[1] + t * dy1] as PointD;
  }

  return { ip, nonParallel: true };
}
