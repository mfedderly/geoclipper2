import { LocalMinima } from "./LocalMinima.ts";

export function locMinSorter(
  locMin1: LocalMinima,
  locMin2: LocalMinima,
): number {
  return locMin2.vertex.pt[1] - locMin1.vertex.pt[1];
}
