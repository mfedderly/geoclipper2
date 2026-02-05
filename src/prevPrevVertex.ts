import type { Active } from "./Active.ts";
import type { Vertex } from "./Vertex.ts";

export function prevPrevVertex(ae: Active): Vertex {
  return ae.windDx > 0 ? ae.vertexTop!.prev!.prev! : ae.vertexTop!.next!.next!;
}
