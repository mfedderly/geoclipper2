import type { Active } from "./Active.ts";

export function isHeadingLeftHorz(ae: Active) {
  return ae.dx === Infinity;
}
