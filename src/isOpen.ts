import type { Active } from "./Active.ts";

export function isOpen(ae: Active): boolean {
  return ae.localMin.isOpen;
}
