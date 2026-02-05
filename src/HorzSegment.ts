import type { OutPt } from "./OutPt.ts";

export class HorzSegment {
  leftOp?: OutPt;
  rightOp: OutPt | undefined;
  leftToRight = true;

  constructor(op: OutPt) {
    this.leftOp = op;
  }
}
