import assert from "node:assert";
import test from "node:test";
import { groupPolygonPaths } from "../src/groupPolygonPaths.ts";
import type { Paths64 } from "../src/types.ts";

test("groupPolygonPaths", () => {
  const paths = [
    // outer ring
    [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ],
    // inner ring
    [
      [10, 10],
      [90, 10],
      [90, 90],
      [10, 90],
    ].reverse(),
    // outer ring inside inner ring
    [
      [20, 20],
      [80, 20],
      [80, 80],
      [20, 80],
    ],
    // inner ring inside inner outer ring
    [
      [30, 30],
      [70, 30],
      [70, 70],
      [30, 70],
    ].reverse(),
    // unrelated outer ring (which happens to share points with the first ring)
    [
      [100, 0],
      [200, 0],
      [200, 100],
      [100, 100],
    ],
  ] as Paths64;
  const expected = [[paths[0], paths[1]], [paths[2], paths[3]], [paths[4]]];
  const grouped = groupPolygonPaths(paths);
  assert.deepEqual(grouped, expected);
});
