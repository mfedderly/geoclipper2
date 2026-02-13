import type { EndType } from "./EndType.ts";
import type { JoinType } from "./JoinType.ts";
import { ClipperOffset } from "./Offset.ts";
import type { Paths64 } from "./types.ts";

export function inflatePaths(
  subjects: Paths64,
  delta: number,
  joinType: JoinType,
  endType: EndType,
  miterLimit = 2.0,
  arcTolerance = 0,
): Paths64 {
  const solution: Paths64 = [];
  const co = new ClipperOffset(miterLimit, arcTolerance);
  co.addPaths(subjects, joinType, endType);
  co.execute(delta, solution);
  return solution;
}
