import type { Active } from "./Active.ts";
import { isMaxima } from "./isMaxima.ts";

export function getCurrYMaximaVertex(ae: Active) {
  let result = ae.vertexTop;
  if (ae.windDx > 0) {
    while (result!.next!.pt[1] === result!.pt[1]) {
      result = result!.next;
    }
  } else {
    while (result!.prev!.pt[1] === result!.pt[1]) {
      result = result!.prev;
    }
  }
  if (!isMaxima(result!)) {
    result = undefined; // not a maxima
  }
  return result;
}
