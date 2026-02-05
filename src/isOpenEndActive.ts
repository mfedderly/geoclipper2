import type { Active } from "./Active.ts";
import { isOpenEndVertex } from "./isOpenEndVertex.ts";

export function isOpenEndActive(ae: Active): boolean {
  return ae.localMin.isOpen && isOpenEndVertex(ae.vertexTop!);
}
