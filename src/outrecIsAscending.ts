import type { Active } from "./Active.ts";

export function outrecIsAscending(hotEdge: Active): boolean {
  return hotEdge === hotEdge.outrec!.frontEdge;
}
