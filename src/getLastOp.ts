import type { Active } from "./Active.ts";
import type { OutPt } from "./OutPt.ts";

export function getLastOp(hotEdge: Active): OutPt {
  const outrec = hotEdge.outrec!;
  return hotEdge === outrec.frontEdge ? outrec.pts! : outrec.pts!.next!;
}
