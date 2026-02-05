import type { Active } from "./Active.ts";
import { getDx } from "./getDx.ts";
import { JoinWith } from "./JoinWith.ts";
import type { LocalMinima } from "./LocalMinima.ts";
import type { Vertex } from "./Vertex.ts";

export function newActive(
  localMinima: LocalMinima,
  windDx: -1 | 1,
  vertexTop: Vertex,
): Active {
  return {
    bot: localMinima.vertex.pt,
    curX: localMinima.vertex.pt[0],
    windDx,
    vertexTop,
    top: vertexTop.pt,
    localMin: localMinima,
    dx: getDx(localMinima.vertex.pt, vertexTop.pt),

    windCount: 0,
    windCount2: 0,
    isLeftBound: false,
    joinWith: JoinWith.None,

    nextInAEL: undefined,
    prevInAEL: undefined,
    outrec: undefined,
    prevInSEL: undefined,
    nextInSEL: undefined,
    jump: undefined,
  };
}
