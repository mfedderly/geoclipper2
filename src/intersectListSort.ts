import type { IntersectNode } from "./IntersectNode.ts";

export function intersectListSort(a: IntersectNode, b: IntersectNode) {
  // mirror the sorting from the C# library first
  if (a.pt[1] !== b.pt[1]) {
    return b.pt[1] - a.pt[1]; // y descending
  }
  if (a.pt[0] !== b.pt[0]) {
    return a.pt[0] - b.pt[0]; // x ascending
  }

  // provide some additional tiebreakers:

  // The code above this comment is essentially identical to the sorting code in the original C++, C#, and clipper2-rust port.
  // If we have multiple entries in Clipper64.#intersectList with the same x,y coordinates, we can still potentially
  // wind up with entries in the wrong order. The edge tiebreakers below ensure that nodes are evaluated from
  // correct left to right order. I'm not entirely sure why porting the C# code causes this, but an audit of
  // the C++ code doesn't really turn up any differences in the code that populates the intersectList.

  // This specifically fixes Polygons.txt test case #168
  // Thanks to @jpt for discovering this in clipper2-ts

  if (a.edge1.curX !== b.edge1.curX) {
    return a.edge1.curX - b.edge1.curX; // edge1 curX ascending
  }
  return a.edge2.curX - b.edge2.curX; // edge2 curX ascending
}
