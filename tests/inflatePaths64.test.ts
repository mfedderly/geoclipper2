import test from "node:test";
import { createAzimuthalEquidistantProjection } from "../src/createAzimuthalEquidistantProjection.ts";
import { inflatePaths } from "../src/inflatePaths.ts";
import { JoinType } from "../src/JoinType.ts";
import { EndType } from "../src/EndType.ts";
import assert from "node:assert";

test("inflatePaths64 - handles poles", () => {
  const center: [number, number] = [0, 90];
  const { project, unproject } = createAzimuthalEquidistantProjection(center);

  const subjectLatLng: [number, number][] = [
    [-5, 89.99999999],
    [5, 89.99999999],
    [5, 89],
    [-5, 89],
  ];

  const subject = [subjectLatLng.map((c) => project(c)!)];
  const result = inflatePaths(subject, 100, JoinType.Square, EndType.Polygon);
  const unproj = result[0]!.map((pt) => unproject(pt));

  assert.deepEqual(unproj, [
    [5.00050837808629, 88.99999614873855],
    [5.000176333602577, 88.9999907878825],
    [-5.000176333602577, 88.9999907878825],
    [-5.00050837808629, 88.99999614873855],
    [-137.69780562218997, 89.99998783559799],
    [137.69780562218997, 89.99998783559799],
  ]);
});
