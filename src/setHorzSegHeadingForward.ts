import type { HorzSegment } from "./HorzSegment.ts";
import type { OutPt } from "./OutPt.ts";

export function setHorzSegHeadingForward(
  hs: HorzSegment,
  opP: OutPt,
  opN: OutPt,
) {
  if (opP.pt[0] === opN.pt[0]) {
    return false;
  }
  if (opP.pt[0] < opN.pt[0]) {
    hs.leftOp = opP;
    hs.rightOp = opN;
    hs.leftToRight = true;
  } else {
    hs.leftOp = opN;
    hs.rightOp = opP;
    hs.leftToRight = false;
  }
  return true;
}
