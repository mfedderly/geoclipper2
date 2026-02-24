import { pointDToPoint64 } from "./pointDToPoint64.ts";
import type { Projection } from "./Projection.ts";
import type { PointD } from "./types.ts";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
export const EARTH_RADIUS_CM = 637100880; // This is chosen to give us as much precision as possible while still using Point64 within the SAFE_INTEGER range

/**
 * Creates an azimuthal equidistant projection intended for use with GeoJSON data and Clipper2.
 *
 * For best results, the distance of any given point from the center should be less than 10,000 km.
 *
 * When projecting coordinates, this returns a Point64 represented as an x,y offset from the center in centimeters. This scaling
 * was specifically chosen as a balance between JavaScript's MAX_SAFE_INTEGER of ~2^53 and accuracy for GPS data. GeoJSON data
 * with 6 decimal places represents roughly a 10cm area (RFC 7946 section 11.2). By using centimeters we get ourselves below that
 * threshold, and keep ourselves from overflowing JavaScript's integer capabilities.
 *
 * When unprojecting coordinates, this may return longitudes outside [-180, 180]. In order to normalize longitudes you may want
 * to perform one of the following, depending on how you are using the data. For certain map renderers, these out-of-bounds geometries
 * will just be rendered correctly without normalizing.
 * - Split the polygon at the antimeridian (RFC 7946 section 3.1.9)
 * - Set the longitude value within the range using the mod operator `(((longitude % 360) + 540) % 360) - 180`
 * - Set the longitude value within the range using +/- 360 in a while loop (it will likely only enter the while loop 0 or 1 times)
 *
 * @argument center A point to use as the center of a projection. In order to minimize distortion, this is typically chosen
 *   to be the center of the geometries that are being projected. It can also be useful to 'snap' to the north or south pole
 *   if your data is close to there.
 *
 * @returns a pair of project and unproject methods implementing the Projection interface
 *
 * @see https://mathworld.wolfram.com/AzimuthalEquidistantProjection.html
 * @see https://en.wikipedia.org/wiki/Azimuthal_equidistant_projection
 */
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
