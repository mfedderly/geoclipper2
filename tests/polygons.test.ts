import { Clipper64 } from "../src/Clipper64.ts";
import { test } from "node:test";
import { PathType } from "../src/PathType.ts";
import type { Paths64 } from "../src/types.ts";
import { ClipType } from "../src/ClipType.ts";
import { FillRule } from "../src/FillRule.ts";
import assert from "node:assert/strict";
import { area } from "../src/area.ts";
import { parseFixtures } from "./parseFixtures.ts";

await test(`clipper2 - polygon suite`, { timeout: 10_000 }, async (t) => {
  for await (const fixture of parseFixtures("./tests/fixtures/Polygons.txt")) {
    await t.test(fixture.caption, () => {
      const c = new Clipper64();
      const solutionClosed: Paths64 = [];
      const solutionOpen: Paths64 = [];
      c.addPaths(fixture.subjects, PathType.Subject, false);
      c.addPaths(fixture.subjectsOpen, PathType.Subject, true);
      c.addPaths(fixture.clips, PathType.Clip, false);

      const succeeded = c.execute(
        fixture.clipType,
        fixture.fillRule,
        solutionClosed,
        solutionOpen,
      );
      assert.strictEqual(succeeded, true, "succeeded");
      const measuredArea = solutionClosed.reduce(
        (a, path) => a + area(path),
        0,
      );
      const measuredCount = solutionClosed.length + solutionOpen.length;

      // NOTE: this extra tolerance around solution count and area looks weird but is directly
      // ported from the original clipper2 repo (C# which is different than C).
      const { solCount, solArea, testNumber } = fixture;
      if (solCount > 0) {
        if (
          [140, 150, 165, 166, 172, 173, 176, 177, 179].includes(testNumber)
        ) {
          assertNear(measuredCount, solCount, 9);
        } else if (testNumber >= 120) {
          assertNear(measuredCount, solCount, 6);
        } else if ([27, 121, 126].includes(testNumber)) {
          assertNear(measuredCount, solCount, 2);
        } else if (
          [16, 23, 37, 43, 45, 87, 102, 111, 118, 119].includes(testNumber)
        ) {
          // testNumber 16 is special here. The official Clipper2 C# expects it to exactly match.
          // We return 1 instead of an expected 2 Path64's. The C++ tests actually have the same
          // tolerance of 1 as we have done here. The test case involves two triangles where the
          // clip path just barely crosses through the subject path. clipper2-ts and clipper2-rust
          // both include the additional tolerance for #16, so we will too.
          assertNear(measuredCount, solCount, 1);
        } else {
          assert.strictEqual(measuredCount, solCount, "solution count");
        }
      }

      if (solArea > 0) {
        if ([19, 22, 23, 24].includes(testNumber)) {
          assertNear(measuredArea, solArea, 0.5 * solArea, "area");
        } else if (testNumber === 193) {
          assertNear(measuredArea, solArea, 0.25 * solArea, "area");
        } else if (testNumber === 63) {
          assertNear(measuredArea, solArea, 0.1 * solArea, "area");
        } else if (testNumber === 16) {
          assertNear(measuredArea, solArea, 0.075 * solArea, "area");
        } else if ([15, 26].includes(testNumber)) {
          assertNear(measuredArea, solArea, 0.05 * solArea, "area");
        } else if (
          [52, 53, 54, 59, 60, 64, 117, 118, 119, 184].includes(testNumber)
        ) {
          assertNear(measuredArea, solArea, 0.02 * solArea, "area");
        } else {
          assertNear(measuredArea, solArea, 0.01 * solArea, "area");
        }
      }
    });
  }
});

test(`clipper2 - TestHorzSpikes #720`, () => {
  const solutionClosed: Paths64 = [];
  const solutionOpen: Paths64 = [];
  const c = new Clipper64();
  c.addPaths(
    [
      [
        [1600, 0],
        [1600, 100],
        [2050, 100],
        [2050, 300],
        [450, 300],
        [450, 0],
      ],

      [
        [1800, 200],
        [1800, 100],
        [1600, 100],
        [2000, 100],
        [2000, 200],
      ],
    ] as Paths64,
    PathType.Subject,
    false,
  );
  c.execute(ClipType.Union, FillRule.NonZero, solutionClosed, solutionOpen);
  assert(solutionClosed.length >= 1);
});

test(`clipper2 - TestCollinearOnMacOs #777`, () => {
  const solutionClosed: Paths64 = [];
  const solutionOpen: Paths64 = [];
  const subject = [
    [
      [0, -453054451],
      [0, -433253797],
      [-455550000, 0],
    ],
    [
      [0, -433253797],
      [0, 0],
      [-455550000, 0],
    ],
  ] as Paths64;
  const c = new Clipper64();
  c.preserveCollinear = false;
  c.addPaths(subject, PathType.Subject, false);
  c.execute(ClipType.Union, FillRule.NonZero, solutionClosed, solutionOpen);

  assert(solutionClosed.length === 1, "solution size");
  assert(solutionClosed[0]!.length === 3, "solution's path has 3 coordinates");
  assert(area(solutionClosed[0]!) > 0, "solution's path is positive");
  assert(area(subject[0]!) > 0, "subject's first path is positive");
});

function assertNear(
  measured: number,
  expected: number,
  absError: number,
  type: "area" | "count" = "count",
) {
  assert(
    Math.abs(expected - measured) <= absError,
    `solution ${type} ${measured} within ${absError} of ${expected}`,
  );
}
