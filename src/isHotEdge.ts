import type { Active } from "./Active.ts";

export function isHotEdge(ae: Active) {
  return ae.outrec != null;
}
