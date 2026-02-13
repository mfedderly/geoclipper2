import type { Active } from "./Active.ts";
import { isHorizontal } from "./isHorizontal.ts";
import { pointEqual } from "./pointEqual.ts";

export function findEdgeWithMatchingLocMin(e: Active) {
  let result = e.nextInAEL;
  while (result != null) {
    if (result.localMin === e.localMin) {
      return result;
    }
    if (!isHorizontal(result) && !pointEqual(e.bot, result.bot)) {
      result = undefined;
    } else {
      result = result.nextInAEL;
    }
  }
  result = e.prevInAEL;
  while (result != null) {
    if (result.localMin === e.localMin) {
      return result;
    }
    if (!isHorizontal(result) && !pointEqual(e.bot, result.bot)) {
      return undefined;
    }
    result = result.prevInAEL;
  }
  return result;
}
