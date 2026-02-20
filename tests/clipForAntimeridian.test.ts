import test from "node:test";
import { createAzimuthalEquidistantProjection } from "../src/createAzimuthalEquidistantProjection.ts";
import { inflatePaths } from "../src/inflatePaths.ts";
import { JoinType } from "../src/JoinType.ts";
import { EndType } from "../src/EndType.ts";
import { groupPolygonPaths } from "../src/groupPolygonPaths.ts";
import { clipForAntimeridian } from "../src/clipForAntimeridian.ts";
import assert from "node:assert";

// this is roughly a square overlapping the antimeridian at -180
// neither of these rings has the final position that matches the first position, and are not valid geojson
const outer: [number, number][] = [
  [-181, 1],
  [-179, 1],
  [-179, -1],
  [-181, -1],
];

// this is a hole centered within outer. note the reverse winding here
const inner: [number, number][] = [
  [-180.5, -0.5],
  [-179.5, -0.5],
  [-179.5, 0.5],
  [-180.5, 0.5],
];

test("clipForAntimeridian @ -180", () => {
  const input: [number, number][][] = [outer, inner];

  const center: [number, number] = [-180, 0];
  const { project, unproject } = createAzimuthalEquidistantProjection(center);

  const subject = input.map((ring) => ring.map((pt) => project(pt)!));

  const result = inflatePaths(subject, 100, JoinType.Square, EndType.Polygon);
  const grouped = groupPolygonPaths(result);
  const unproj = grouped.map((poly) =>
    poly.map((ring) => ring.map((pt) => unproject(pt))),
  );

  const out = clipForAntimeridian(unproj);

  assert.strictEqual(out.length, 2, "should have two output polygons");
  assert.strictEqual(
    out[0]!.length,
    2,
    "should have one outer and one inner ring on first polygon",
  );
  assert.strictEqual(
    out[1]!.length,
    2,
    "should have one outer and one inner ring on second polygon",
  );
});

test("clipForAntimeridian @ 0", () => {
  // shifted by 180 degrees towards [0, 0]
  const input: [number, number][][] = [
    outer.map((pt) => [pt[0] + 180, pt[1]]),
    inner.map((pt) => [pt[0] + 180, pt[1]]),
  ];

  const center: [number, number] = [0, 0];
  const { project, unproject } = createAzimuthalEquidistantProjection(center);

  const subject = input.map((ring) => ring.map((pt) => project(pt)!));

  const result = inflatePaths(subject, 100, JoinType.Square, EndType.Polygon);
  const grouped = groupPolygonPaths(result);
  const unproj = grouped.map((poly) =>
    poly.map((ring) => ring.map((pt) => unproject(pt))),
  );

  const out = clipForAntimeridian(unproj);

  assert.strictEqual(out.length, 1, "should have 1 output polygon");
  assert.strictEqual(
    out[0]!.length,
    2,
    "should have one outer and one inner ring on first polygon",
  );
});

test("clipForAntimeridian @ 180", () => {
  // shifted by 360 degrees over to the positive side of the antimeridian
  const input: [number, number][][] = [
    outer.map((pt) => [pt[0] + 360, pt[1]]),
    inner.map((pt) => [pt[0] + 360, pt[1]]),
  ];

  const center: [number, number] = [180, 0];
  const { project, unproject } = createAzimuthalEquidistantProjection(center);

  const subject = input.map((ring) => ring.map((pt) => project(pt)!));

  const result = inflatePaths(subject, 100, JoinType.Square, EndType.Polygon);
  const grouped = groupPolygonPaths(result);
  const unproj = grouped.map((poly) =>
    poly.map((ring) => ring.map((pt) => unproject(pt))),
  );

  const out = clipForAntimeridian(unproj);

  assert.strictEqual(out.length, 2, "should have two output polygons");
  assert.strictEqual(
    out[0]!.length,
    2,
    "should have one outer and one inner ring on first polygon",
  );
  assert.strictEqual(
    out[1]!.length,
    2,
    "should have one outer and one inner ring on second polygon",
  );
});
