import { normalizeVector } from "./normalizeVector.ts";
import type { PointD } from "./types.ts";

export function getAvgUnitVector(vec1: PointD, vec2: PointD): PointD {
  return normalizeVector([vec1[0] + vec2[0], vec1[1] + vec2[1]] as PointD);
}
