import { almostZero } from "./almostZero.ts";
import { hypotenuse } from "./hypotenuse.ts";
import type { PointD } from "./types.ts";

export function normalizeVector(vec: PointD): PointD {
  const h = hypotenuse(vec[0], vec[1]);
  if (almostZero(h)) {
    return [0, 0] as PointD;
  }
  const inverseHypot = 1 / h;
  return [vec[0] * inverseHypot, vec[1] * inverseHypot] as PointD;
}
