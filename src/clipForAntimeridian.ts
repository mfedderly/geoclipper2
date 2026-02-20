// Sutherland–Hodgman but written to only clip for -1, 0, or +1 copies of the world
export function clipForAntimeridian(polygons: [number, number][][][]) {
  const out: [number, number][][][] = [];

  for (const poly of polygons) {
    if (crossesAntimeridian(poly)) {
      const left: [number, number][][] = [];
      const right: [number, number][][] = [];
      const center: [number, number][][] = [];

      for (const ring of poly) {
        const leftRing = clipByLng(ring, -540, -180);
        const rightRing = clipByLng(ring, 180, 540);
        const centerRing = clipByLng(ring, -180, 180);

        if (leftRing.length > 0) {
          left.push(leftRing);
        }
        if (rightRing.length > 0) {
          right.push(rightRing);
        }
        if (centerRing.length > 0) {
          center.push(centerRing);
        }
      }

      shiftLng(left, 360);
      shiftLng(right, -360);
      out.push(...[left, center, right].filter((p) => p.length > 0));
    } else {
      out.push(poly);
    }
  }

  return out;
}

function shiftLng(poly: [number, number][][], dx: number) {
  for (const ring of poly) {
    for (const pt of ring) {
      pt[0] += dx;
    }
  }
}

function crossesAntimeridian(poly: [number, number][][]) {
  return !poly[0]!.every((pt) => pt[0] >= -180 && pt[0] <= 180);
}

function clipByLng(ring: [number, number][], xMin: number, xMax: number) {
  let prev = ring[ring.length - 1]!;
  let prevIn = isIn(prev);
  const result: [number, number][] = [];
  for (const pt of ring) {
    const ptIn = isIn(pt);

    if ((ptIn === 0 && prevIn === -1) || (ptIn === -1 && prevIn === 0)) {
      // crosses xMin
      result.push(interp(prev, pt, xMin));
    } else if ((ptIn === 0 && prevIn === 1) || (ptIn === 1 && prevIn === 0)) {
      // crosses xMax
      result.push(interp(prev, pt, xMax));
    }

    if (ptIn === 0) {
      result.push(pt);
    }

    prev = pt;
    prevIn = ptIn;
  }

  return result;

  /**
   * @returns 0 if the point is within xMin and xMax, -1 if the point is below xMin, 1 if the point is above xMax
   */
  function isIn(pt: [number, number]): -1 | 0 | 1 {
    return pt[0] < xMin ? -1 : pt[0] > xMax ? 1 : 0;
  }
}

function interp(
  pt1: [number, number],
  pt2: [number, number],
  x: number,
): [number, number] {
  const dy = pt2[1] - pt1[1];
  const dx = pt2[0] - pt1[0];
  return [x, pt1[1] + ((x - pt1[0]) * dy) / dx];
}
