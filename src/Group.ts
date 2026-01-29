import { EndType } from "./EndType.ts";
import { getLowestPathInfo } from "./getLowestPathInfo.ts";
import type { JoinType } from "./JoinType.ts";
import { stripDuplicates } from "./stripDuplicates.ts";
import type { Paths64 } from "./types.ts";

export class Group {
  inPaths: Paths64;
  joinType: JoinType;
  endType: EndType;
  pathsReversed: boolean;
  lowestPathIdx: number;

  constructor(
    paths: Paths64,
    joinType: JoinType,
    endType: EndType = EndType.Polygon,
  ) {
    this.joinType = joinType;
    this.endType = endType;

    const isJoined = endType === EndType.Polygon || endType === EndType.Joined;
    this.inPaths = [];
    for (const path of paths) {
      this.inPaths.push(stripDuplicates(path, isJoined));
    }

    if (endType === EndType.Polygon) {
      const { idx, isNegArea } = getLowestPathInfo(this.inPaths);
      this.lowestPathIdx = idx;
      this.pathsReversed = idx >= 0 && isNegArea;
    } else {
      this.lowestPathIdx = -1;
      this.pathsReversed = false;
    }
  }
}
