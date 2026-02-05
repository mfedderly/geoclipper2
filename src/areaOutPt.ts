import type { OutPt } from "./OutPt.ts";

export function areaOutPt(op: OutPt) {
  // NOTE: the original function did all of this math in a double, and is therefore safe against overflow
  // https://en.wikipedia.org/wiki/Shoelace_formula
  let area = 0.0;
  let op2 = op;
  do {
    area += (op2.prev.pt[1] + op2.pt[1]) * (op2.prev.pt[0] - op2.pt[0]);
    op2 = op2.next!;
  } while (op2 != op);
  return area / 2;
}
