import { pointDToPoint64 } from "./pointDToPoint64.ts";
import type { Path64, Point64, PointD } from "./types.ts";

export function ellipse(
  center: Point64,
  radiusX: number,
  radiusY = 0,
  steps = 0,
): Path64 {
  if (radiusX <= 0) {
    return [];
  }
  if (radiusY <= 0) {
    radiusY = radiusX;
  }
  if (steps <= 2) {
    steps = Math.ceil(Math.PI * Math.sqrt((radiusX + radiusY) / 2));
  }

  const si = Math.sin((2 * Math.PI) / steps);
  const co = Math.cos((2 * Math.PI) / steps);
  let dx = co;
  let dy = si;
  const result: Path64 = [];
  for (let i = 1; i < steps; i++) {
    result.push(
      pointDToPoint64([
        center[0] + radiusX * dx,
        center[1] + radiusY * dy,
      ] as PointD),
    );
    const x = dx * co - dy * si;
    dy = dy * co + dx * si;
    dx = x;
  }

  return result;
}
