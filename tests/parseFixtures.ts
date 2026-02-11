import type { Path64, Paths64, Point64 } from "../src/types.ts";
import { ClipType } from "../src/ClipType.ts";
import { FillRule } from "../src/FillRule.ts";
import fs from "node:fs";
import readline from "node:readline";

export interface ParsedFixture {
  caption: string;
  testNumber: number;
  clipType: ClipType;
  fillRule: FillRule;
  solArea: number;
  solCount: number;
  subjects: Paths64;
  subjectsOpen: Paths64;
  clips: Paths64;
}

const CLIPTYPE_LOOKUP = new Map<string, ClipType>([
  ["UNION", ClipType.Union],
  ["DIFFERENCE", ClipType.Difference],
  ["INTERSECTION", ClipType.Intersection],
  ["XOR", ClipType.Xor],
]);

const FILLRULE_LOOKUP = new Map<string, FillRule>([
  ["EVENODD", FillRule.EvenOdd],
  ["NONZERO", FillRule.NonZero],
  ["POSITIVE", FillRule.Positive],
  ["NEGATIVE", FillRule.Negative],
]);

export async function* parseFixtures(filePath: string) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface(fileStream);
  let current: Partial<ParsedFixture> = {
    subjects: [],
    subjectsOpen: [],
    clips: [],
  };
  let mode: "subjects" | "clips" | "subjects_open" | false = false;

  for await (const line of rl) {
    if (line === "") {
      yield current as ParsedFixture;
      current = {
        subjects: [],
        subjectsOpen: [],
        clips: [],
      };
      mode = false;
    } else if (line === "SUBJECTS") {
      mode = "subjects";
    } else if (line === "CLIPS") {
      mode = "clips";
    } else if (line === "SUBJECTS_OPEN") {
      mode = "subjects_open";
    } else if (mode) {
      const numbers = line.split(/[, ]+/).filter((s) => s.trim() !== "");
      if (numbers.length % 2 !== 0) {
        throw new Error("Wrong number of numbers after splitting");
      }

      // Parsing the coordinate lines is pretty tricky, as the actual contents are not entirely uniform.
      // Most of the fixtures have ", " as delimiters between entries, but some just have " " or ",".
      // So just parse them into a list of parseable numbers, and put them together in pairs.
      const pairs: Path64 = [];
      for (let i = 0; i < numbers.length; i += 2) {
        const x = parseInt(numbers[i]!, 10);
        const y = parseInt(numbers[i + 1]!, 10);
        if (Number.isNaN(x) || Number.isNaN(y)) {
          throw new Error(
            `failed to parse number: ${numbers[i]}, ${numbers[i + 1]}`,
          );
        }
        pairs.push([x, y] as Point64);
      }
      if (mode === "subjects") {
        current.subjects!.push(pairs);
      } else if (mode === "clips") {
        current.clips!.push(pairs);
      } else {
        current.subjectsOpen!.push(pairs);
      }
    } else if (line.startsWith("CAPTION: ")) {
      current.caption = line.slice("CAPTION: ".length);
      current.testNumber = parseInt(current.caption, 10);
    } else if (line.startsWith("CLIPTYPE: ")) {
      current.clipType = CLIPTYPE_LOOKUP.get(line.slice("CLIPTYPE: ".length))!;
    } else if (line.startsWith("FILLRULE: ")) {
      current.fillRule = FILLRULE_LOOKUP.get(line.slice("FILLRULE: ".length))!;
    } else if (line.startsWith("SOL_AREA: ")) {
      current.solArea = parseInt(line.slice("SOL_AREA: ".length), 10);
    } else if (line.startsWith("SOL_COUNT: ")) {
      current.solCount = parseInt(line.slice("SOL_COUNT: ".length), 10);
    }
  }
  // yield the last one if we parsed something
  if (current.caption != null) {
    yield current as ParsedFixture;
  }
}
