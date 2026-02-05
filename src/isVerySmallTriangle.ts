import type { OutPt } from "./OutPt.ts";
import { ptsReallyClose } from "./ptsReallyClose.ts";

export function isVerySmallTriangle(op: OutPt) {
  return (
    op.next!.next === op.prev &&
    (ptsReallyClose(op.prev.pt, op.next!.pt) ||
      ptsReallyClose(op.pt, op.next!.pt) ||
      ptsReallyClose(op.pt, op.prev.pt))
  );
}
