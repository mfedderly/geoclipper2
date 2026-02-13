import { addLocMin } from "./addLocMin.ts";
import type { LocalMinima } from "./LocalMinima.ts";
import type { PathType } from "./PathType.ts";
import { pointEqual } from "./pointEqual.ts";
import type { Paths64 } from "./types.ts";
import { Vertex } from "./Vertex.ts";
import { VertexFlags } from "./VertexFlags.ts";

export function addPathsToVertexList(
  paths: Paths64,
  polytype: PathType,
  isOpen: boolean,
  minimaList: LocalMinima[],
  vertexList: Vertex[],
) {
  for (const path of paths) {
    let v0: Vertex | undefined;
    let prevV: Vertex | undefined;
    let currV: Vertex;
    for (const pt of path) {
      if (v0 == null) {
        v0 = new Vertex(pt, VertexFlags.None);
        vertexList.push(v0);
        prevV = v0;
      } else if (!pointEqual(prevV!.pt, pt)) {
        // ie skips duplicates
        currV = new Vertex(pt, VertexFlags.None, prevV);
        vertexList.push(currV);
        prevV!.next = currV;
        prevV = currV;
      }
    }

    if (prevV?.prev == null) {
      continue;
    }
    if (!isOpen && pointEqual(prevV.pt, v0!.pt)) {
      prevV = prevV.prev;
    }
    prevV.next = v0!;
    v0!.prev = prevV;
    if (!isOpen && prevV.next === prevV) {
      continue;
    }

    // OK, we have a valid path
    let goingUp: boolean;
    if (isOpen) {
      currV = v0!.next!;
      while (currV !== v0 && currV.pt[1] === v0!.pt[1]) {
        currV = currV.next!;
      }
      goingUp = currV.pt[1] <= v0!.pt[1];
      if (goingUp) {
        v0!.flags = VertexFlags.OpenStart;
        addLocMin(v0!, polytype, true, minimaList);
      } else {
        v0!.flags = VertexFlags.OpenStart | VertexFlags.LocalMax;
      }
    } else {
      // closed path
      prevV = v0!.prev;
      while (prevV !== v0 && prevV!.pt[1] === v0!.pt[1]) {
        prevV = prevV!.prev;
      }
      if (prevV === v0) {
        continue; // only open paths can be completely flat
      }
      goingUp = prevV!.pt[1] > v0!.pt[1];
    }

    const goingUp0 = goingUp;
    prevV = v0;
    currV = v0!.next!;
    while (currV !== v0) {
      if (currV.pt[1] > prevV!.pt[1] && goingUp) {
        prevV!.flags |= VertexFlags.LocalMax;
        goingUp = false;
      } else if (currV.pt[1] < prevV!.pt[1] && !goingUp) {
        goingUp = true;
        addLocMin(prevV!, polytype, isOpen, minimaList);
      }
      prevV = currV;
      currV = currV.next!;
    }

    if (isOpen) {
      prevV!.flags |= VertexFlags.OpenEnd;
      if (goingUp) {
        prevV!.flags |= VertexFlags.LocalMax;
      } else {
        addLocMin(prevV!, polytype, isOpen, minimaList);
      }
    } else if (goingUp !== goingUp0) {
      if (goingUp0) {
        addLocMin(prevV!, polytype, false, minimaList);
      } else {
        prevV!.flags |= VertexFlags.LocalMax;
      }
    }
  }
}
