import { pointDToPoint64 } from "./pointDToPoint64.ts";
import type { Projection } from "./Projection.ts";
import type { PointD } from "./types.ts";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
export const EARTH_RADIUS_CM = 637100880; // This is chosen to give us as much precision as possible while still using Point64 within the SAFE_INTEGER range

// See: https://mathworld.wolfram.com/AzimuthalEquidistantProjection.html
export function createAzimuthalEquidistantProjection(
  center: [number, number],
): Projection {
  const lambda0 = center[0] * DEG_TO_RAD;
  const phi0 = center[1] * DEG_TO_RAD;
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);

  return {
    project(point) {
      const lambda = point[0] * DEG_TO_RAD;
      const phi = point[1] * DEG_TO_RAD;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const deltaLambda = lambda - lambda0;
      const cosDeltaLambda = Math.cos(deltaLambda);
      const cosPhiTimesCosDeltaLambda = cosPhi * cosDeltaLambda;

      const cosC = sinPhi0 * sinPhi + cosPhi0 * cosPhiTimesCosDeltaLambda;

      const c = Math.acos(Math.max(-1, Math.min(1, cosC)));

      // K' is the scale factor relative to the distance from center
      // If c is 0, we are at the center point; k' is 1.
      const kPrime = c === 0 ? 1 : c / Math.sin(c);

      const x = EARTH_RADIUS_CM * kPrime * cosPhi * Math.sin(deltaLambda);
      const y =
        EARTH_RADIUS_CM *
        kPrime *
        (cosPhi0 * sinPhi - sinPhi0 * cosPhiTimesCosDeltaLambda);

      // Note: Y is usually inverted in screen coordinates (SVG/Canvas)
      return pointDToPoint64([x, -y] as PointD);
    },

    unproject(point) {
      const x = point[0];
      const y = -point[1]; // reverse the y-coordinate inversion from above

      const rho = Math.sqrt(x * x + y * y);
      if (rho === 0) {
        return [center[0], center[1]];
      }

      const c = rho / EARTH_RADIUS_CM;
      const cosC = Math.cos(c);
      const sinC = Math.sin(c);
      const phi = Math.asin(cosC * sinPhi0 + (y * sinC * cosPhi0) / rho);
      const lambda =
        lambda0 +
        Math.atan2(x * sinC, rho * cosPhi0 * cosC - y * sinPhi0 * sinC);

      return [lambda * RAD_TO_DEG, phi * RAD_TO_DEG];
    },
  };
}
