import { isVerySmallTriangle } from "./isVerySmallTriangle.ts";
import type { OutPt } from "./OutPt.ts";

export function isValidClosedPath(op: OutPt | undefined) {
  return (
    op != null &&
    op.next !== op &&
    (op.next !== op.prev || !isVerySmallTriangle(op))
  );
}
