import type { Path64, Point64 } from "./types.ts";

export function rect64ToPath(topLeft: Point64, bottomRight: Point64): Path64 {
  const [xMin, yMin] = topLeft;
  const [xMax, yMax] = bottomRight;
  return [
    [xMin, yMin] as Point64,
    [xMax, yMin] as Point64,
    [xMax, yMax] as Point64,
    [xMin, yMax] as Point64,
  ];
}
