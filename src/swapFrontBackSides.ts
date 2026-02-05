import type { OutRec } from "./OutRec.ts";

export function swapFrontBackSides(outrec: OutRec) {
  // while this proc. is needed for open paths
  // it's almost never needed for closed paths
  const ae2 = outrec.frontEdge!;
  outrec.frontEdge = outrec.backEdge;
  outrec.backEdge = ae2;
  outrec.pts = outrec.pts!.next;
}
