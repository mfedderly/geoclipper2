import type { Active } from "./Active.ts";

export function extractFromSEL(ae: Active) {
  const res = ae.nextInSEL;
  if (res != null) {
    res.prevInSEL = ae.prevInSEL;
  }
  ae.prevInSEL!.nextInSEL = res;
  return res;
}
