export function almostZero(value: number, epsilon = 0.001) {
  return Math.abs(value) < epsilon;
}
