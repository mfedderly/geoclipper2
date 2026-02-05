import type { Active } from "./Active.ts";

export function isHorizontal(ae: Active) {
  return ae.top[1] === ae.bot[1];
}
