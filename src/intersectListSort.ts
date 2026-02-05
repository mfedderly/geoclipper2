import type { IntersectNode } from "./IntersectNode.ts";

export function intersectListSort(a: IntersectNode, b: IntersectNode) {
  if (a.pt[1] !== b.pt[1]) {
    return a.pt[1] > b.pt[1] ? -1 : 1;
  }
  if (a.pt[0] === b.pt[0]) {
    return 0;
  }
  return a.pt[0] < b.pt[0] ? -1 : 1;
}
