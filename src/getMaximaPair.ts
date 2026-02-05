import type { Active } from "./Active.ts";

export function getMaximaPair(ae: Active) {
  let ae2 = ae.nextInAEL;
  while (ae2 != null) {
    if (ae2.vertexTop === ae.vertexTop) {
      return ae2; // Found!
    }
    ae2 = ae2.nextInAEL;
  }
  return;
}
