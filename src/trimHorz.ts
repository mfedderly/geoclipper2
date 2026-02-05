import type { Active } from "./Active.ts";
import { getDx } from "./getDx.ts";
import { isMaxima } from "./isMaxima.ts";
import { nextVertex } from "./nextVertex.ts";

export function trimHorz(horzEdge: Active, preserveCollinear: boolean) {
  let wasTrimmed = false;
  let pt = nextVertex(horzEdge).pt;

  while (pt[1] === horzEdge.top[1]) {
    // always trim 180 deg. spikes (in closed paths)
    // but otherwise break if preserveCollinear = true
    if (
      preserveCollinear &&
      pt[0] < horzEdge.top[0] !== horzEdge.bot[0] < horzEdge.top[0]
    ) {
      break;
    }

    horzEdge.vertexTop = nextVertex(horzEdge);
    horzEdge.top = pt;
    wasTrimmed = true;
    if (isMaxima(horzEdge.vertexTop)) break;
    pt = nextVertex(horzEdge).pt;
  }
  if (wasTrimmed) {
    horzEdge.dx = getDx(horzEdge.bot, horzEdge.top); // +/-infinity
  }
}
