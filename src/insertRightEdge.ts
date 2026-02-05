import type { Active } from "./Active.ts";

export function insertRightEdge(ae: Active, ae2: Active) {
  ae2.nextInAEL = ae.nextInAEL;
  if (ae.nextInAEL != null) {
    ae.nextInAEL.prevInAEL = ae2;
  }
  ae2.prevInAEL = ae;
  ae.nextInAEL = ae2;
}
