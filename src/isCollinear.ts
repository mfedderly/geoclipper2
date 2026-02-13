import { productsAreEqual } from "./productsAreEqual.ts";
import type { Point64 } from "./types.ts";

export function isCollinear(
  pt1: Point64,
  sharedPt: Point64,
  pt2: Point64,
): boolean {
  // NOTE a,b,c,d can overflow the SAFE_INTEGER range here if the first value is a very large positive number,
  // and the second value is a large negative number.

  // a,b,c,d were longs in the original implementation
  const a = BigInt(sharedPt[0]) - BigInt(pt1[0]);
  const b = BigInt(pt2[1]) - BigInt(sharedPt[1]);
  const c = BigInt(sharedPt[1]) - BigInt(pt1[1]);
  const d = BigInt(pt2[0]) - BigInt(sharedPt[0]);

  // When checking for collinearity with very large coordinate values
  // then ProductsAreEqual is more accurate than using CrossProduct.
  return productsAreEqual(a, b, c, d);
}
