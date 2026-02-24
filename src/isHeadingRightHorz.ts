import type { Active } from "./Active.ts";

export function isHeadingRightHorz(ae: Active): boolean {
  return ae.dx === -Infinity;
}
