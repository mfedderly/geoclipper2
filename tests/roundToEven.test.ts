import assert from "node:assert";
import { roundToEven } from "../src/roundToEven.ts";
import test from "node:test";

test("roundToEven", () => {
  assert.strictEqual(roundToEven(0), 0);
  assert.strictEqual(roundToEven(0.5), 0);
  assert.strictEqual(roundToEven(1), 1);
  assert.strictEqual(roundToEven(1.5), 2);

  assert.strictEqual(roundToEven(-0.5), 0);
  assert.strictEqual(roundToEven(-1), -1);
  assert.strictEqual(roundToEven(-1.5), -2);
});
