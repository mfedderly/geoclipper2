import { area } from "./area.ts";
import type { Path64 } from "./types.ts";

export class PolyPath64 {
  polygon: Path64 | undefined; // polytree root's polygon == undefined
  parent: PolyPath64 | undefined;
  childs: PolyPath64[] = [];

  constructor(parent: PolyPath64 | undefined) {
    this.parent = parent;
  }

  isHole() {
    const lvl = this.getLevel();
    return lvl !== 0 && (lvl & 1) === 0;
  }

  getLevel(): number {
    let result = 0;
    let pp = this.parent;
    while (pp != null) {
      result++;
      pp = pp.parent;
    }
    return result;
  }

  clear() {
    this.childs.length = 0;
  }

  addChild(p: Path64): PolyPath64 {
    const newChild = new PolyPath64(this);
    newChild.polygon = p;
    this.childs.push(newChild);
    return newChild;
  }

  child(index: number): PolyPath64 {
    if (index < 0 || index >= this.childs.length) {
      throw new Error("Index out of range");
    }
    return this.childs[index]!;
  }

  area(): number {
    // result should be treated as a double, and is therefore safe from overflow
    let result = this.polygon == null ? 0 : area(this.polygon);
    for (const child of this.childs) {
      result += child.area();
    }
    return result;
  }
}
