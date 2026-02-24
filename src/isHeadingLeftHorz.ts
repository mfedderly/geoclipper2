import type { Active } from "./Active.ts";

export function isHeadingLeftHorz(ae: Active): boolean {
  return ae.dx === Infinity;
}
