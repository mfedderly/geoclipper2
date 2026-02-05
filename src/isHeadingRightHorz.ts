import type { Active } from "./Active.ts";

export function isHeadingRightHorz(ae: Active) {
  return ae.dx === -Infinity;
}
