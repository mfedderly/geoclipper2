import type { Point64 } from "./types.ts";

export function segsIntersect(
  seg1a: Point64,
  seg1b: Point64,
  seg2a: Point64,
  seg2b: Point64,
  inclusive = false,
) {
  // NOTE the original has math in doubles, so this is safe to do without worrying about an overflow
  const dy1 = seg1b[1] - seg1a[1];
  const dx1 = seg1b[0] - seg1a[0];
  const dy2 = seg2b[1] - seg2a[1];
  const dx2 = seg2b[0] - seg2a[0];
  const cp = dy1 * dx2 - dy2 * dx1;
  if (cp === 0) {
    return false; // ie parallel segments
  }

  if (inclusive) {
    //result **includes** segments that touch at an end point
    let t = (seg1a[0] - seg2a[0]) * dy2 - (seg1a[1] - seg2a[1]) * dx2;
    if (t == 0) {
      return true;
    }
    if (t > 0) {
      if (cp < 0 || t > cp) {
        return false;
      }
    } else if (cp > 0 || t < cp) {
      return false; // false when t more neg. than cp
    }

    t = (seg1a[0] - seg2a[0]) * dy1 - (seg1a[1] - seg2a[1]) * dx1;
    if (t == 0) {
      return true;
    }
    if (t > 0) {
      return cp > 0 && t <= cp;
    } else {
      return cp < 0 && t >= cp; // true when t less neg. than cp
    }
  } else {
    //result **excludes** segments that touch at an end point
    let t = (seg1a[0] - seg2a[0]) * dy2 - (seg1a[1] - seg2a[1]) * dx2;
    if (t == 0) {
      return false;
    }
    if (t > 0) {
      if (cp < 0 || t >= cp) {
        return false;
      }
    } else if (cp > 0 || t <= cp) {
      return false; // false when t more neg. than cp
    }

    t = (seg1a[0] - seg2a[0]) * dy1 - (seg1a[1] - seg2a[1]) * dx1;
    if (t == 0) {
      return false;
    }
    if (t > 0) {
      return cp > 0 && t < cp;
    } else {
      return cp < 0 && t > cp; // true when t less neg. than cp
    }
  }
}
