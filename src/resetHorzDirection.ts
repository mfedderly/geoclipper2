import type { Active } from "./Active.ts";
import type { Vertex } from "./Vertex.ts";

export function resetHorzDirection(
  horz: Active,
  vertexMax?: Vertex,
): { leftX: number; rightX: number; isLeftToRight: boolean } {
  let leftX;
  let rightX;
  if (horz.bot[0] === horz.top[0]) {
    // the horizontal edge is going nowhere ...
    leftX = horz.curX;
    rightX = horz.curX;
    let ae = horz.nextInAEL;
    while (ae != null && ae.vertexTop != vertexMax) ae = ae.nextInAEL;
    return { isLeftToRight: ae != null, leftX, rightX };
  }

  if (horz.curX < horz.top[0]) {
    leftX = horz.curX;
    rightX = horz.top[0];
    return { isLeftToRight: true, leftX, rightX };
  }
  leftX = horz.top[0];
  rightX = horz.curX;
  return { isLeftToRight: false, leftX, rightX }; // right to left
}
