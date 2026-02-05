import type { Active } from "./Active.ts";
import { isMaxima } from "./isMaxima.ts";
import { VertexFlags } from "./VertexFlags.ts";

export function getCurrYMaximaVertex_Open(ae: Active) {
  let result = ae.vertexTop;
  if (ae.windDx > 0) {
    while (
      result!.next!.pt[1] === result!.pt[1] &&
      (result!.flags & (VertexFlags.OpenEnd | VertexFlags.LocalMax)) ===
        VertexFlags.None
    ) {
      result = result!.next;
    }
  } else {
    while (
      result!.prev!.pt[1] === result!.pt[1] &&
      (result!.flags & (VertexFlags.OpenEnd | VertexFlags.LocalMax)) ===
        VertexFlags.None
    ) {
      result = result!.prev;
    }
  }
  if (!isMaxima(result!)) {
    result = undefined; // not a maxima
  }
  return result;
}
