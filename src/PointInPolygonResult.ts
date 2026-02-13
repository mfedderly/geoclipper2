export const PointInPolygonResult = {
  IsOn: 0,
  IsInside: 1,
  IsOutside: 2,
} as const;
export type PointInPolygonResult =
  (typeof PointInPolygonResult)[keyof typeof PointInPolygonResult];
