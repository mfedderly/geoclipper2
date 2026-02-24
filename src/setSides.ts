import type { Active } from "./Active.ts";
import type { OutRec } from "./OutRec.ts";

export function setSides(
  outrec: OutRec,
  startEdge: Active,
  endEdge: Active,
): void {
  outrec.frontEdge = startEdge;
  outrec.backEdge = endEdge;
}
