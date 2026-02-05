import type { OutRec } from "./OutRec.ts";

export function getRealOutRec(outRec: OutRec | undefined) {
  while (outRec != null && outRec.pts == null) {
    outRec = outRec.owner;
  }
  return outRec;
}
