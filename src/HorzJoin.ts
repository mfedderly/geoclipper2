import type { OutPt } from "./OutPt.ts";

export class HorzJoin {
  op1?: OutPt;
  op2?: OutPt;
  constructor(ltor: OutPt, rtol: OutPt) {
    this.op1 = ltor;
    this.op2 = rtol;
  }
}
