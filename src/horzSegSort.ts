import type { HorzSegment } from "./HorzSegment.ts";

export function horzSegSort(
  hs1: HorzSegment | undefined,
  hs2: HorzSegment | undefined,
) {
  if (hs1 == null || hs2 == null) {
    return 0;
  }
  if (hs1.rightOp == null) {
    return hs2.rightOp == null ? 0 : 1;
  }
  if (hs2.rightOp == null) {
    return -1;
  }
  return hs1.leftOp!.pt[0] - hs2.leftOp!.pt[0];
}
