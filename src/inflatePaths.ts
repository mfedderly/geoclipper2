import type { EndType } from "./EndType.ts";
import type { JoinType } from "./JoinType.ts";
import { ClipperOffset } from "./Offset.ts";
import type { Paths64 } from "./types.ts";

/**
 * Given a list of paths, inflate (buffer) them by the given amount
 *
 * @param subjects A list of paths using Point64 (integer) coordinates
 * @param delta A distance in the same units as the subjects coordinates
 * @param joinType https://www.angusj.com/clipper2/Docs/Units/Clipper/Types/JoinType.htm
 * @param endType https://www.angusj.com/clipper2/Docs/Units/Clipper/Types/EndType.htm
 * @param miterLimit https://www.angusj.com/clipper2/Docs/Units/Clipper.Offset/Classes/ClipperOffset/Properties/MiterLimit.htm
 * @param arcTolerance https://www.angusj.com/clipper2/Docs/Units/Clipper.Offset/Classes/ClipperOffset/Properties/ArcTolerance.htm
 * @returns A collection of paths representing the output polygons (may be exterior or interior rings), can use groupPolygonPaths to reassemble individual polygons
 */
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
