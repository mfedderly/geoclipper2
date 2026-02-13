// returns true if (and only if) a * b == c * d
export function productsAreEqual(a: bigint, b: bigint, c: bigint, d: bigint) {
  // NOTE this was originally much more complicated utilizing abs, UInt128Struct, and triSign
  // We bypass that complexity in our implementation by using bigint for the calculation
  return a * b === c * d;
}
