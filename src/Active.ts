import type { JoinWith } from "./JoinWith.ts";
import type { LocalMinima } from "./LocalMinima.ts";
import type { OutRec } from "./OutRec.ts";
import type { Point64 } from "./types.ts";
import type { Vertex } from "./Vertex.ts";

///////////////////////////////////////////////////////////////////
// Important: UP and DOWN here are premised on Y-axis positive down
// displays, which is the orientation used in Clipper's development.
///////////////////////////////////////////////////////////////////

export interface Active {
  bot: Point64;
  top: Point64;
  // TODO careful curX needs to be a long
  curX: number; // current (updated at every new scanline)
  dx: number;
  windDx: 1 | -1; // 1 or -1 depending on winding direction
  windCount: number;
  windCount2: number; // winding count of the opposite polytype
  outrec: OutRec | undefined;

  // AEL: 'active edge list' (Vatti's AET - active edge table)
  //     a linked list of all edges (from left to right) that are present
  //     (or 'active') within the current scanbeam (a horizontal 'beam' that
  //     sweeps from bottom to top over the paths in the clipping operation).
  prevInAEL: Active | undefined;
  nextInAEL: Active | undefined;

  // SEL: 'sorted edge list' (Vatti's ST - sorted table)
  //     linked list used when sorting edges into their new positions at the
  //     top of scanbeams, but also (re)used to process horizontals.
  prevInSEL: Active | undefined;
  nextInSEL: Active | undefined;
  jump: Active | undefined;
  vertexTop?: Vertex;
  localMin: LocalMinima; // the bottom of an edge 'bound' (also Vatti)
  isLeftBound: boolean;
  joinWith: JoinWith;
}
