import type { HorzSegment } from "./HorzSegment.ts";
import type { OutRec } from "./OutRec.ts";
import type { Point64 } from "./types.ts";

export class OutPt {
  pt: Point64;
  next?: OutPt;
  prev: OutPt;
  outrec: OutRec;
  horz?: HorzSegment;

  constructor(pt: Point64, outrec: OutRec) {
    this.pt = pt;
    this.outrec = outrec;
    this.next = this;
    this.prev = this;
  }
}
