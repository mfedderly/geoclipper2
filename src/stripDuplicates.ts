import { point64Equal } from "./point64Equal.ts";
import type { Path64 } from "./types.ts";

export function stripDuplicates(path: Path64, isClosedPath: boolean): Path64 {
  const cnt = path.length;
  const result: Path64 = [];
  if (cnt === 0) {
    return result;
  }
  let lastPt = path[0]!;
  result.push(lastPt);
  for (let i = 0; i < cnt; i++) {
    if (!point64Equal(lastPt, path[i]!)) {
      lastPt = path[i]!;
      result.push(lastPt);
    }
  }
  if (isClosedPath && point64Equal(lastPt, result[0]!)) {
    result.pop();
  }
  return result;
}
