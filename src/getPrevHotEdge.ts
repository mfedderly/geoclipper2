import type { Active } from "./Active.ts";
import { isHotEdge } from "./isHotEdge.ts";
import { isOpen } from "./isOpen.ts";

export function getPrevHotEdge(ae: Active) {
  let prev = ae.prevInAEL;
  while (prev != null && (isOpen(prev) || !isHotEdge(prev))) {
    prev = prev.prevInAEL;
  }
  return prev;
}
