import { area } from "./area.ts";
import { pointInPolygon } from "./pointInPolygon.ts";
import { PointInPolygonResult } from "./PointInPolygonResult.ts";
import type { Path64, Paths64 } from "./types.ts";

interface Polygon {
  poly: Paths64 | undefined;
  children: Polygon[];
}

/**
 * Given any number of paths, separate them into distinct Paths64 groupings that
 * contain one outer ring and any number of inner (hole) rings.
 */
export function groupPolygonPaths(paths: Paths64): Paths64[] {
  const root: Polygon = {
    poly: undefined,
    children: [],
  };
  const result: Paths64[] = [];

  for (const ring of paths) {
    if (area(ring) > 0) {
      insertOuter(ring, root, result);
    } else {
      insertInner(ring, root);
    }
  }

  return result;
}

/**
 * @returns true if path1 has no points outside of path2 and at least one point inside path2
 */
function path1InsidePath2(path1: Path64, path2: Path64): boolean {
  let hasPointInside = false;
  for (const pt of path1) {
    const pip = pointInPolygon(pt, path2);
    if (pip === PointInPolygonResult.IsOutside) {
      return false;
    } else if (pip === PointInPolygonResult.IsInside) {
      hasPointInside = true;
    }
  }
  return hasPointInside;
}

function insertOuter(path: Path64, polygon: Polygon, result: Paths64[]) {
  // try to place this path within any of the children first
  for (const child of polygon.children) {
    if (path1InsidePath2(path, child.poly![0]!)) {
      insertOuter(path, child, result);
      return;
    }
  }

  // if that fails, we have a new polygon at this level
  const newPolygon: Polygon = { poly: [path], children: [] };
  result.push(newPolygon.poly!);
  polygon.children.push(newPolygon);
}

function insertInner(path: Path64, polygon: Polygon) {
  // try to place this inner ring within any of the children first
  for (const child of polygon.children) {
    if (path1InsidePath2(path, child.poly![0]!)) {
      insertInner(path, child);
      return;
    }
  }

  // push a new hole for this polygon, mutating a polygon that has already been added to the result
  polygon.poly?.push(path);
}
