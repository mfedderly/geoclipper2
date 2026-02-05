export function sqr(val: number) {
  // NOTE the original clipper2 has two variants of this that operate on double and long val,
  // but they both do the multiply on doubles, so this is the equivalent operation in javascript either way
  return val * val;
}
