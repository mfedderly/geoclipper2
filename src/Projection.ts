import type { Point64 } from "./types.ts";

export interface Projection {
  project: (point: [number, number]) => Point64 | undefined;
  unproject: (point: Point64) => [number, number];
}
