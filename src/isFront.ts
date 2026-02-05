import type { Active } from "./Active.ts";

export function isFront(ae: Active) {
  return ae === ae.outrec!.frontEdge;
}
