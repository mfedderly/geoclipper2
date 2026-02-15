import test, { describe } from "node:test";
import {
  createAzimuthalEquidistantProjection,
  EARTH_RADIUS_CM,
} from "../src/createAzimuthalEquidistantProjection.ts";
import assert from "node:assert";

describe("projection - azimuthal equidistant", () => {
  test("smoke test center and extreme points along axis", () => {
    const { project, unproject } = createAzimuthalEquidistantProjection([0, 0]);

    // Map of input coordinate to expected projection output coordinate
    // Note that all of the outputs should be scaled by EARTH_RADIUS_CM in both dimensions, but we can omit this for the 0 values.
    // This cannot be made to test on the unit circle instead, because the projection does the cast from PointD to Point64 for us.
    const tests = new Map<[number, number], [number, number]>([
      [
        [0, 0],
        [0, 0],
      ],
      [
        [90, 0],
        [Math.trunc((Math.PI / 2) * EARTH_RADIUS_CM), 0],
      ],
      [
        [0, 90],
        [0, Math.trunc((-Math.PI / 2) * EARTH_RADIUS_CM)],
      ],
      [
        [0, -90],
        [0, Math.trunc((Math.PI / 2) * EARTH_RADIUS_CM)],
      ],
      [
        [180, 0],
        [Math.trunc(Math.PI * EARTH_RADIUS_CM), 0],
      ],
    ]);

    for (const [input, output] of tests) {
      const projected = project(input);
      assert.deepEqual(
        projected,
        output,
        `${input.join()} should project to ${output.join()}`,
      );
      const inverted = unproject(projected!);

      // Do a slightly more tolerant check on the unprojected results.
      // `project` clamps to the nearest integer (in centimeters) in this implementation in order to use Clipper2's integer math.
      // This introduces a small error which is below the threshold of accuracy that we claim for this library.
      // We aim for precision to 7 decimal places within our implementation, as RFC7946 states that a 6 decimal
      // place coordinate is accurate to within 10cm.
      assertClose(inverted[0], input[0], `projected x of ${input.join()}`);
      assertClose(inverted[1], input[1], `projected y of ${input.join()}`);
    }
  });
});

function assertClose(actual: number, expected: number, msg: string) {
  assert.ok(
    Math.abs(actual - expected) < 1e-7,
    `${msg}: Expected ${expected} but got ${actual}`,
  );
}
