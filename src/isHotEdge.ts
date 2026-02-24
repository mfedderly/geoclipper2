import type { Active } from "./Active.ts";

export function isHotEdge(ae: Active): boolean {
  return ae.outrec != null;
}
