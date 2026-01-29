import { area } from "./area.ts";
import type { Paths64, Point64 } from "./types.ts";

export function getLowestPathInfo(paths: Paths64): {
  idx: number;
  isNegArea: boolean;
} {
  let idx = -1;
  let isNegArea = false;
  const botPt = [Number.MAX_VALUE, Number.MAX_VALUE] as Point64;

  for (let i = 0; i < paths.length; i++) {
    let a = Number.MAX_VALUE;
    for (const pt of paths[i]!) {
      if (pt[1] < botPt[1] || (pt[1] === botPt[1] && pt[0] >= botPt[0])) {
        continue;
      }

      if (a === Number.MAX_VALUE) {
        a = area(paths[i]!);
        if (a === 0) {
          break; // invalid closed path so break from inner loop
        }
        isNegArea = a < 0;
      }
      idx = i;
      botPt[0] = pt[0];
      botPt[1] = pt[1];
    }
  }

  return { idx, isNegArea };
}
