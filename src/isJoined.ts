import type { Active } from "./Active.ts";
import { JoinWith } from "./JoinWith.ts";

export function isJoined(e: Active) {
  return e.joinWith !== JoinWith.None;
}
