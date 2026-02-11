import test from "node:test";
import { parseFixtures } from "./parseFixtures.ts";
import { Clipper64 } from "../src/Clipper64.ts";
import type { Paths64 } from "../src/types.ts";
import { PathType } from "../src/PathType.ts";
import assert from "node:assert";
import { area } from "../src/area.ts";

await test(`clipper2 - lines suite`, { timeout: 10_000 }, async (t) => {
  for await (const fixture of parseFixtures("./tests/fixtures/Lines.txt")) {
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

      const { solCount, solArea } = fixture;
      if (solArea > 0) {
        const measuredArea = solutionClosed.reduce(
          (a, path) => a + area(path),
          0,
        );
        const a = solArea / measuredArea;
        assert(
          a > 0.995 && a < 1.005,
          `area ${measuredArea} within tolerance of ${solArea}`,
        );
      }

      if (solCount > 0) {
        assert(
          Math.abs(solutionClosed.length - solCount) < 2,
          `Solution count ${solutionClosed.length} within 2 of ${solCount}`,
        );
      }

      // C++ tests have some extra checks on the first fixture
      if (fixture.testNumber === 1) {
        assert(
          solutionClosed.length === 1,
          "test 1 should have 1 closed solution",
        );
        assert(
          solutionClosed[0]!.length === 6,
          "test 1 closed path has 6 points",
        );
        assert(
          area(solutionClosed[0]!) > 0,
          "test 1 closed path has positive area",
        );
        assert(
          solutionOpen.length === 1,
          "test 1 should have 1 open solutions",
        );
        assert(
          solutionOpen[0]!.length === 2,
          "test 1's first open solution should have 2 points",
        );
        assert(
          solutionOpen[0]![0]![1] === 6,
          "test 1's first open solution starts at y: 6",
        );
      }
    });
  }
});
