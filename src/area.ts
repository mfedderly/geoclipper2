import type { Path64 } from "./types.ts";

/**
 * Calculate the area of a given path. Typically a positive result
 * indicates an exterior ring, and a negative result indicates an interior (hole) ring.
 *
 * The math here is expected to be performed in a double-precision float (JavaScript's native Number type)
 */
export function area(path: Path64): number {
  // https://en.wikipedia.org/wiki/Shoelace_formula
  let a = 0; // this is expected to be a double
  const cnt = path.length;
  if (cnt < 3) {
    return a;
  }
  let prevPt = path[cnt - 1]!;
  for (const pt of path) {
    a += (prevPt[1] + pt[1]) * (prevPt[0] - pt[0]);
    prevPt = pt;
  }
  return a / 2;
}
