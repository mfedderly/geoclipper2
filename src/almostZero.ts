export function almostZero(value: number, epsilon = 0.001): boolean {
  return Math.abs(value) < epsilon;
}
