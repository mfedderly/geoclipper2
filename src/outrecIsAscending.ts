import type { Active } from "./Active.ts";

export function outrecIsAscending(hotEdge: Active) {
  return hotEdge === hotEdge.outrec!.frontEdge;
}
