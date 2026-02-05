import type { Active } from "./Active.ts";
import { isFront } from "./isFront.ts";
import { isOpenEndActive } from "./isOpenEndActive.ts";
import { setOwner } from "./setOwner.ts";

export function joinOutrecPaths(ae1: Active, ae2: Active) {
  // join ae2 outrec path onto ae1 outrec path and then delete ae2 outrec path
  // pointers. (NB Only very rarely do the joining ends share the same coords.)
  const p1Start = ae1.outrec!.pts!;
  const p2Start = ae2.outrec!.pts!;
  const p1End = p1Start.next!;
  const p2End = p2Start.next!;
  if (isFront(ae1)) {
    p2End.prev = p1Start;
    p1Start.next = p2End;
    p2Start.next = p1End;
    p1End.prev = p2Start;
    ae1.outrec!.pts = p2Start;
    // nb: if IsOpen(e1) then e1 & e2 must be a 'maximaPair'
    ae1.outrec!.frontEdge = ae2.outrec!.frontEdge;
    if (ae1.outrec!.frontEdge != null) {
      ae1.outrec!.frontEdge.outrec = ae1.outrec;
    }
  } else {
    p1End.prev = p2Start;
    p2Start.next = p1End;
    p1Start.next = p2End;
    p2End.prev = p1Start;

    ae1.outrec!.backEdge = ae2.outrec!.backEdge;
    if (ae1.outrec!.backEdge != null) {
      ae1.outrec!.backEdge.outrec = ae1.outrec;
    }
  }

  // after joining, the ae2.OutRec must contains no vertices ...
  ae2.outrec!.frontEdge = undefined;
  ae2.outrec!.backEdge = undefined;
  ae2.outrec!.pts = undefined;
  ae1.outrec!.outPtCount += ae2.outrec!.outPtCount;
  setOwner(ae2.outrec!, ae1.outrec!);

  if (isOpenEndActive(ae1)) {
    ae2.outrec!.pts = ae1.outrec!.pts;
    ae1.outrec!.pts = undefined;
  }

  // and ae1 and ae2 are maxima and are about to be dropped from the Actives list.
  ae1.outrec = undefined;
  ae2.outrec = undefined;
}
