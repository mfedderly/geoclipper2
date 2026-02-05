import type { Active } from "./Active.ts";

export function getLastOp(hotEdge: Active) {
  const outrec = hotEdge.outrec!;
  return hotEdge === outrec.frontEdge ? outrec.pts! : outrec.pts!.next!;
}
