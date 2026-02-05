import type { Vertex } from "./Vertex.ts";
import { VertexFlags } from "./VertexFlags.ts";

export function isMaxima(vertex: Vertex) {
  return (vertex.flags & VertexFlags.LocalMax) !== VertexFlags.None;
}
