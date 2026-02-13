import type { Active } from "./Active.ts";
import { roundToEven } from "./roundToEven.ts";

export function topX(ae: Active, currentY: number) {
  if (currentY === ae.top[1] || ae.top[0] === ae.bot[0]) {
    return ae.top[0];
  }
  if (currentY === ae.bot[1]) {
    return ae.bot[0];
  }

  // NOTE this return value math should be safe because we are returning an x coordinate and therefore should be restricted
  // into the SAFE_INTEGER range. The original implementation uses longs here.
  // use MidpointRounding.ToEven in order to explicitly match the nearbyint behaviour on the C++ implementation
  return ae.bot[0] + roundToEven(ae.dx * (currentY - ae.bot[1]));
}
