import type { Path64 } from "./types.ts";

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
