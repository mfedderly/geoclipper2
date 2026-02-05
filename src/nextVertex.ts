import type { Active } from "./Active.ts";
import type { Vertex } from "./Vertex.ts";

export function nextVertex(ae: Active): Vertex {
  return ae.windDx > 0 ? ae.vertexTop!.next! : ae.vertexTop!.prev!;
}
