import type { Point64 } from "./types.ts";
import { VertexFlags } from "./VertexFlags.ts";

export class Vertex {
  pt: Point64;
  next?: Vertex;
  prev: Vertex | undefined;
  flags: VertexFlags;

  constructor(pt: Point64, flags: VertexFlags, prev?: Vertex) {
    this.pt = pt;
    this.flags = flags;
    this.prev = prev;
  }
}
