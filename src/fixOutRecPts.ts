import type { OutRec } from "./OutRec.ts";

export function fixOutRecPts(outrec: OutRec) {
  let op = outrec.pts!;
  do {
    op.outrec = outrec;
    op = op.next!;
  } while (op != outrec.pts);
}
