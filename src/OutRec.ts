// OutRec: path data structure for clipping solutions

import type { Active } from "./Active.ts";
import type { OutPt } from "./OutPt.ts";
import type { PolyPath64 } from "./PolyPath64.ts";
import type { Rect64 } from "./Rect64.ts";
import type { Path64 } from "./types.ts";

export interface OutRec {
  idx: number;
  outPtCount: number;
  owner: OutRec | undefined;
  frontEdge: Active | undefined;
  backEdge: Active | undefined;
  pts: OutPt | undefined;
  polypath?: PolyPath64;
  bounds: Rect64;
  path: Path64;
  isOpen: boolean;
  splits?: number[];
  recursiveSplit?: OutRec;
}
