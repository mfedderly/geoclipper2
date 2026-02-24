import type { Active } from "./Active.ts";

export function isFront(ae: Active): boolean {
  return ae === ae.outrec!.frontEdge;
}
