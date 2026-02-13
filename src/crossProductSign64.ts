import type { Point64 } from "./types.ts";

export function crossProductSign64(
  pt1: Point64,
  pt2: Point64,
  pt3: Point64,
): -1 | 0 | 1 {
  // NOTE: we can overflow SAFE_INTEGER_RANGE on any of the calculations for a,b,c,d if we have a large positive
  // first coordinate, and a correspondingly large negative coordinate that gets subtracted.

  // a,b,c,d are longs in the original implementation
  const a = BigInt(pt2[0]) - BigInt(pt1[0]);
  const b = BigInt(pt3[1]) - BigInt(pt2[1]);
  const c = BigInt(pt2[1]) - BigInt(pt1[1]);
  const d = BigInt(pt3[0]) - BigInt(pt2[0]);

  const signAB = triSign(a) * triSign(b);
  const signCD = triSign(c) * triSign(d);

  if (signAB === signCD) {
    // ab,cd are UInt128Struct originally
    const ab = abs(a) * abs(b);
    const cd = abs(c) * abs(d);
    const result: -1 | 0 | 1 = ab > cd ? 1 : ab < cd ? -1 : 0;
    return signAB > 0 ? result : (-result as typeof result);
  }

  return signAB > signCD ? 1 : -1;
}

function triSign(x: bigint) {
  return x < 0 ? -1 : x > 0 ? 1 : 0;
}

function abs(x: bigint) {
  return x < 0 ? -x : x;
}
