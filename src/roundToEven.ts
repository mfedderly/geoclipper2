export function roundToEven(n: number): number {
  // TODO test this for implementation correctness
  // The original C code uses banker's rounding (round to the nearest even number), so we match that here
  const w = Math.floor(n);
  const f = n - w;
  if (f < 0.5) {
    return w;
  }
  if (f > 0.5) {
    return w + 1;
  }
  return w % 2 === 0 ? w : w + 1;
}
