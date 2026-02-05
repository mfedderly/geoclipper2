import { roundToEven } from "./roundToEven.ts";
import type { Point64 } from "./types.ts";

export function getClosestPtOnSegment(
  offPt: Point64,
  seg1: Point64,
  seg2: Point64,
): Point64 {
  if (seg1[0] === seg2[0] && seg1[1] === seg2[1]) {
    return seg1;
  }
  // this math uses doubles in the original
  const dx = seg2[0] - seg1[0];
  const dy = seg2[1] - seg1[1];
  let q =
    ((offPt[0] - seg1[0]) * dx + (offPt[1] - seg1[1]) * dy) /
    (dx * dx + dy * dy);
  if (q < 0) {
    q = 0;
  } else if (q > 1) {
    q = 1;
  }

  // NOTE: This safely gets us from doubles back to the SAFE_INTEGER range, because they are X and Y coordinates again
  return [
    // use MidpointRounding.ToEven in order to explicitly match the nearbyint behaviour on the C++ side
    seg1[0] + roundToEven(q * dx),
    seg1[1] + roundToEven(q * dy),
  ] as Point64;
}
