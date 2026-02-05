import { getRealOutRec } from "./getRealOutRec.ts";
import type { HorzSegment } from "./HorzSegment.ts";
import { setHorzSegHeadingForward } from "./setHorzSegHeadingForward.ts";

export function updateHorzSegment(hs: HorzSegment) {
  const op = hs.leftOp!;
  const outrec = getRealOutRec(op.outrec)!;
  const outrecHasEdges = outrec.frontEdge != null;
  const curr_y = op.pt[1];
  let opP = op;
  let opN = op;
  if (outrecHasEdges) {
    const opA = outrec.pts!;
    const opZ = opA.next!;
    while (opP !== opZ && opP.prev.pt[1] === curr_y) {
      opP = opP.prev;
    }
    while (opN !== opA && opN.next!.pt[1] === curr_y) {
      opN = opN.next!;
    }
  } else {
    while (opP.prev !== opN && opP.prev.pt[1] === curr_y) {
      opP = opP.prev;
    }
    while (opN.next !== opP && opN.next!.pt[1] === curr_y) {
      opN = opN.next!;
    }
  }

  const result =
    setHorzSegHeadingForward(hs, opP, opN) && hs.leftOp!.horz == null;

  if (result) {
    hs.leftOp!.horz = hs;
  } else {
    hs.rightOp = undefined; // for sorting
  }
  return result;
}
