import type { Active } from "./Active.ts";

export function isOpen(ae: Active) {
  return ae.localMin.isOpen;
}
