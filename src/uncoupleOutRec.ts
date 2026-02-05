import type { Active } from "./Active.ts";

export function uncoupleOutRec(ae: Active) {
  const outrec = ae.outrec;
  if (outrec == null) {
    return;
  }
  outrec.frontEdge!.outrec = undefined;
  outrec.backEdge!.outrec = undefined;
  outrec.frontEdge = undefined;
  outrec.backEdge = undefined;
}
