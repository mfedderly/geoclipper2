import type { PathType } from "./PathType.ts";
import type { Vertex } from "./Vertex.ts";

export class LocalMinima {
  vertex: Vertex;
  polytype: PathType;
  isOpen: boolean;

  constructor(vertex: Vertex, polytype: PathType, isOpen = false) {
    this.vertex = vertex;
    this.polytype = polytype;
    this.isOpen = isOpen;
  }

  isEqual(other: LocalMinima) {
    return this.vertex === other.vertex; // reference equality
  }
}
