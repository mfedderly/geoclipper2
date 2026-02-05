// returns true if (and only if) a * b == c * d
export function productsAreEqual(a: bigint, b: bigint, c: bigint, d: bigint) {
  // TODO this was originally much more complicated utilizing abs, UInt128Struct, and triSign
  return a * b === c * d;
}
