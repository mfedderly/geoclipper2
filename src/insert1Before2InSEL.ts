import type { Active } from "./Active.ts";

export function insert1Before2InSEL(ae1: Active, ae2: Active) {
  ae1.prevInSEL = ae2.prevInSEL;
  if (ae1.prevInSEL != null) {
    ae1.prevInSEL.nextInSEL = ae1;
  }
  ae1.nextInSEL = ae2;
  ae2.prevInSEL = ae1;
}
