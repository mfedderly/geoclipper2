import type { Active } from "./Active.ts";
import { roundToEven } from "./roundToEven.ts";

export function topX(ae: Active, currentY: number) {
  if (currentY === ae.top[1] || ae.top[0] === ae.bot[0]) {
    return ae.top[0];
  }
  if (currentY === ae.bot[1]) {
    return ae.bot[0];
  }

  // TODO check this math to make sure we don't overflow, its supposed to be all in longs
  // use MidpointRounding.ToEven in order to explicitly match the nearbyint behaviour on the C++ side
  return ae.bot[0] + roundToEven(ae.dx * (currentY - ae.bot[1]));
}
