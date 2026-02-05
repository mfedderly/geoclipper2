import type { Active } from "./Active.ts";

export function swapOutrecs(ae1: Active, ae2: Active) {
  const or1 = ae1.outrec; // at least one edge has
  const or2 = ae2.outrec; // an assigned outrec
  if (or1 === or2) {
    const ae = or1!.frontEdge;
    or1!.frontEdge = or1!.backEdge;
    or1!.backEdge = ae;
    return;
  }

  if (or1 != null) {
    if (ae1 === or1.frontEdge) {
      or1.frontEdge = ae2;
    } else {
      or1.backEdge = ae2;
    }
  }

  if (or2 != null) {
    if (ae2 === or2.frontEdge) {
      or2.frontEdge = ae1;
    } else {
      or2.backEdge = ae1;
    }
  }

  ae1.outrec = or2;
  ae2.outrec = or1;
}
