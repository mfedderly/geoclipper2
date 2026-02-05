// IntersectNode: a structure representing 2 intersecting edges.
// Intersections must be sorted so they are processed from the largest

import type { Active } from "./Active.ts";
import type { Point64 } from "./types.ts";

// Y coordinates to the smallest while keeping edges adjacent.
export class IntersectNode {
  pt: Point64;
  edge1: Active;
  edge2: Active;

  constructor(pt: Point64, edge1: Active, edge2: Active) {
    this.pt = pt;
    this.edge1 = edge1;
    this.edge2 = edge2;
  }
}
