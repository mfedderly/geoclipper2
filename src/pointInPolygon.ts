import { crossProductSign64 } from "./crossProductSign64.ts";
import { PointInPolygonResult } from "./PointInPolygonResult.ts";
import type { Path64, Point64 } from "./types.ts";

export function pointInPolygon(pt: Point64, polygon: Path64) {
  const len = polygon.length;
  let start = 0;

  if (len < 3) {
    return PointInPolygonResult.IsOutside;
  }

  while (start < len && polygon[start]![1] === pt[1]) {
    start++;
  }
  if (start === len) {
    return PointInPolygonResult.IsOutside;
  }
  let isAbove = polygon[start]![1] < pt[1];
  const startingAbove = isAbove;
  let val = 0;
  let i = start + 1;
  let end = len;
  for (;;) {
    if (i === end) {
      if (end === 0 || start === 0) {
        break;
      }
      end = start;
      i = 0;
    }

    if (isAbove) {
      while (i < end && polygon[i]![1] < pt[1]) {
        i++;
      }
    } else {
      while (i < end && polygon[i]![1] > pt[1]) {
        i++;
      }
    }
    if (i === end) {
      continue;
    }

    const curr = polygon[i]!;
    let prev: Point64;
    if (i > 0) {
      prev = polygon[i - 1]!;
    } else {
      prev = polygon[len - 1]!;
    }

    if (curr[1] === pt[1]) {
      if (
        curr[0] === pt[0] ||
        (curr[1] === prev[1] && pt[0] < prev[0] !== pt[0] < curr[0])
      ) {
        return PointInPolygonResult.IsOn;
      }
      i++;
      if (i === start) {
        break;
      }
      continue;
    }

    if (pt[0] < curr[0] && pt[0] < prev[0]) {
      // we're only interested in edges crossing on the left
    } else if (pt[0] > prev[0] && pt[0] > curr[0]) {
      val = 1 - val; // toggle val
    } else {
      const cps2 = crossProductSign64(prev, curr, pt);
      if (cps2 === 0) {
        return PointInPolygonResult.IsOn;
      }
      if (cps2 < 0 === isAbove) {
        val = val - 1;
      }
    }
    isAbove = !isAbove;
    i++;
  }

  if (isAbove === startingAbove) {
    return val === 0
      ? PointInPolygonResult.IsOutside
      : PointInPolygonResult.IsInside;
  }
  if (i === len) {
    i = 0;
  }
  const cps =
    i === 0
      ? crossProductSign64(polygon[len - 1]!, polygon[0]!, pt)
      : crossProductSign64(polygon[i - 1]!, polygon[i]!, pt);
  if (cps === 0) {
    return PointInPolygonResult.IsOn;
  }
  if (cps < 0 === isAbove) val = 1 - val;
  return val === 0
    ? PointInPolygonResult.IsOutside
    : PointInPolygonResult.IsInside;
}
