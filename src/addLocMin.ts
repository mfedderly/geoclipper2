import { LocalMinima } from "./LocalMinima.ts";
import type { PathType } from "./PathType.ts";
import type { Vertex } from "./Vertex.ts";
import { VertexFlags } from "./VertexFlags.ts";

export function addLocMin(
  vert: Vertex,
  polytype: PathType,
  isOpen: boolean,
  minimaList: LocalMinima[],
) {
  // make sure the vertex is added only once ...
  if ((vert.flags & VertexFlags.LocalMin) != VertexFlags.None) {
    return;
  }
  vert.flags |= VertexFlags.LocalMin;
  const lm = new LocalMinima(vert, polytype, isOpen);
  minimaList.push(lm);
}
