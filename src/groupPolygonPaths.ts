import { area } from "./area.ts";
import { pointInPolygon } from "./pointInPolygon.ts";
import { PointInPolygonResult } from "./PointInPolygonResult.ts";
import type { Path64, Paths64 } from "./types.ts";

interface Polygon {
  bbox: BBox;
  poly: Paths64 | undefined;
  children: Polygon[];
}

type BBox = [number, number, number, number];

/**
 * Given any number of paths, separate them into distinct Paths64 groupings that
 * contain one outer ring and any number of inner (hole) rings.
 */
export function groupPolygonPaths(paths: Paths64): Paths64[] {
  const root: Polygon = {
    poly: undefined,
    bbox: [
      Number.MIN_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    ],
    children: [],
  };
  const result: Paths64[] = [];

  for (const ring of paths) {
    const box = bbox(ring);
    if (area(ring) > 0) {
      insertOuter(ring, box, root, result);
    } else {
      insertInner(ring, box, root);
    }
  }

  return result;
}

/**
 * @returns true if path1 has no points outside of path2 and at least one point inside path2
 */
function path1InsidePath2(
  path1: Path64,
  path1BBox: BBox,
  path2: Path64,
  path2BBox: BBox,
): boolean {
  if (!bboxOverlap(path1BBox, path2BBox)) {
    return false;
  }

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

function insertOuter(
  path: Path64,
  bbox: BBox,
  polygon: Polygon,
  result: Paths64[],
) {
  // try to place this path within any of the children first
  for (const child of polygon.children) {
    if (path1InsidePath2(path, bbox, child.poly![0]!, child.bbox)) {
      insertOuter(path, bbox, child, result);
      return;
    }
  }

  // if that fails, we have a new polygon at this level
  const newPolygon: Polygon = { bbox, poly: [path], children: [] };
  result.push(newPolygon.poly!);
  polygon.children.push(newPolygon);
}

function insertInner(path: Path64, bbox: BBox, polygon: Polygon) {
  // try to place this inner ring within any of the children first
  for (const child of polygon.children) {
    if (path1InsidePath2(path, bbox, child.poly![0]!, child.bbox)) {
      insertInner(path, bbox, child);
      return;
    }
  }

  // push a new hole for this polygon, mutating a polygon that has already been added to the result
  polygon.poly?.push(path);
}

function bbox(path: Path64): BBox {
  const bbox: BBox = [
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
  ];
  for (const pt of path) {
    bbox[0] = Math.min(pt[0], bbox[0]);
    bbox[1] = Math.min(pt[1], bbox[1]);
    bbox[2] = Math.max(pt[0], bbox[2]);
    bbox[3] = Math.max(pt[1], bbox[3]);
  }
  return bbox;
}

function bboxOverlap(b1: BBox, b2: BBox) {
  return !(b1[0] > b2[2] || b1[2] < b2[0] || b1[1] > b2[3] || b1[3] < b2[1]);
}
