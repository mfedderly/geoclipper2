import type { Vertex } from "./Vertex.ts";
import { VertexFlags } from "./VertexFlags.ts";

export function isOpenEndVertex(v: Vertex) {
  return (
    (v.flags & (VertexFlags.OpenStart | VertexFlags.OpenEnd)) !==
    VertexFlags.None
  );
}
