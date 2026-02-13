import type { Point64, PointD } from "./types.ts";

/**
 * Converts a PointD to a Point64 with the same 'round towards zero' behavior as the original
 * implementation in C++ / C#.
 *
 * @argument pt The value of this must be within the SAFE_INTEGER range for JavaScript.
 *   Specifically: it is expected to be used to create output x,y coordinates.
 */
export function pointDToPoint64(pt: PointD): Point64 {
  // NOTE: this is carefully implemented to match the C# behavior to go from a double to an long.
  // "When you convert a double or float value to an integral type, this value is rounded toward zero to the nearest integral value."
  // https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/numeric-conversions#explicit-numeric-conversions
  // "it truncates (cuts off) the dot and the digits to the right of it, no matter whether the argument is a positive or negative number"
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

  // The correctness here also depends on the resulting x and y values being real coordinates and therefore be limited to SAFE_INTEGER
  // It is unsafe to use this with a PointD that has a value outside of the SAFE_INTEGER range.
  return [Math.trunc(pt[0]), Math.trunc(pt[1])] as Point64;
}
