import type { Active } from "./Active.ts";
import { crossProductSign64 } from "./crossProductSign64.ts";
import { isCollinear } from "./isCollinear.ts";
import { isMaxima } from "./isMaxima.ts";
import { nextVertex } from "./nextVertex.ts";
import { prevPrevVertex } from "./prevPrevVertex.ts";

export function isValidAelOrder(resident: Active, newcomer: Active): boolean {
  if (newcomer.curX !== resident.curX) {
    return newcomer.curX > resident.curX;
  }

  // get the turning direction  a1.top, a2.bot, a2.top
  const d = crossProductSign64(resident.top, newcomer.bot, newcomer.top);
  if (d !== 0) {
    return d < 0;
  }

  // edges must be collinear to get here

  // for starting open paths, place them according to
  // the direction they're about to turn
  if (!isMaxima(resident.vertexTop!) && resident.top[1] > newcomer.top[1]) {
    return (
      crossProductSign64(newcomer.bot, resident.top, nextVertex(resident).pt) <=
      0
    );
  }

  if (!isMaxima(newcomer.vertexTop!) && newcomer.top[1] > resident.top[1]) {
    return (
      crossProductSign64(newcomer.bot, newcomer.top, nextVertex(newcomer).pt) >=
      0
    );
  }

  const y = newcomer.bot[1];
  const newcomerIsLeft = newcomer.isLeftBound;

  if (resident.bot[1] !== y || resident.localMin.vertex.pt[1] !== y) {
    return newcomer.isLeftBound;
  }

  // resident must also have just been inserted
  if (resident.isLeftBound !== newcomerIsLeft) {
    return newcomerIsLeft;
  }

  if (isCollinear(prevPrevVertex(resident).pt, resident.bot, resident.top)) {
    return true;
  }

  // compare turning direction of the alternate bound
  return (
    crossProductSign64(
      prevPrevVertex(resident).pt,
      newcomer.bot,
      prevPrevVertex(newcomer).pt,
    ) >
      0 ===
    newcomerIsLeft
  );
}
