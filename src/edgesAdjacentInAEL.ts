import type { IntersectNode } from "./IntersectNode.ts";

export function edgesAdjacentInAEL(inode: IntersectNode) {
  return (
    inode.edge1.nextInAEL === inode.edge2 ||
    inode.edge1.prevInAEL === inode.edge2
  );
}
