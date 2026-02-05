import type { OutPt } from "./OutPt.ts";

export function disposeOutPt(op: OutPt) {
  const result = op.next === op ? undefined : op.next;
  op.prev.next = op.next!;
  op.next!.prev = op.prev;
  // op === undefined
  return result;
}
