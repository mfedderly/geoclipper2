/*******************************************************************************
 * Author    :  Angus Johnson                                                   *
 * Date      :  11 October 2025                                                 *
 * Website   :  https://www.angusj.com                                          *
 * Copyright :  Angus Johnson 2010-2025                                         *
 * Purpose   :  Path Offset (Inflate/Shrink)                                    *
 * License   :  https://www.boost.org/LICENSE_1_0.txt                           *
 *******************************************************************************/

import { Clipper64 } from "./Clipper64.ts";
import { ClipType } from "./ClipType.ts";
import { crossProductD } from "./crossProductD.ts";
import { dotProductD } from "./dotProductD.ts";
import { ellipse } from "./ellipse.ts";
import { EndType } from "./EndType.ts";
import { FillRule } from "./FillRule.ts";
import { getAvgUnitVector } from "./getAvgUnitVector.ts";
import { getLineIntersectPtD } from "./getLineIntersectPtD.ts";
import { getUnitNormal } from "./getUnitNormal.ts";
import { Group } from "./Group.ts";
import { JoinType } from "./JoinType.ts";
import { negatePtD } from "./negatePtD.ts";
import { pointEqual } from "./pointEqual.ts";
import { pointDToPoint64 } from "./pointDToPoint64.ts";
import { rect64ToPath } from "./rect64ToPath.ts";
import { reflectPoint } from "./reflectPoint.ts";
import { translatePoint } from "./translatePoint.ts";
import type { Path64, Paths64, Point64, PointD } from "./types.ts";

const TOLERANCE = 1.0e-12;

// Clipper2 approximates arcs by using series of relatively short straight
//line segments. And logically, shorter line segments will produce better arc
// approximations. But very short segments can degrade performance, usually
// with little or no discernable improvement in curve quality. Very short
// segments can even detract from curve quality, due to the effects of integer
// rounding. Since there isn't an optimal number of line segments for any given
// arc radius (that perfectly balances curve approximation with performance),
// arc tolerance is user defined. Nevertheless, when the user doesn't define
// an arc tolerance (ie leaves alone the 0 default value), the calculated
// default arc tolerance (offset_radius / 500) generally produces good (smooth)
// arc approximations without producing excessively small segment lengths.
// See also: https://www.angusj.com/clipper2/Docs/Trigonometry.htm
const ARC_CONST = 0.002; // <-- 1/500

export class ClipperOffset {
  miterLimit: number;
  arcTolerance: number;
  preserveCollinear: boolean;
  reverseSolution: boolean;
  #solution: Paths64 = [];
  #normals: PointD[] = [];
  #groupDelta = 0;
  pathOut: Path64 = [];
  #groupList: Group[] = [];
  #delta = 0;
  #mitLimSqr = 0;
  #stepsPerRad = 0;
  #stepCos = 0;
  #stepSin = 0;
  #joinType: JoinType = JoinType.Bevel;
  #endType: EndType = EndType.Square;

  constructor(
    miterLimit = 2.0,
    arcTolerance = 0.0,
    preserveCollinear = false,
    reverseSolution = false,
  ) {
    this.miterLimit = miterLimit;
    this.arcTolerance = arcTolerance;
    this.preserveCollinear = preserveCollinear;
    this.reverseSolution = reverseSolution;
  }

  clear() {
    this.#groupList = [];
  }

  addPath(path: Path64, joinType: JoinType, endType: EndType): void {
    if (path.length) {
      return;
    }
    this.addPaths([path], joinType, endType);
  }

  addPaths(paths: Paths64, joinType: JoinType, endType: EndType): void {
    if (paths.length === 0) {
      return;
    }
    this.#groupList.push(new Group(paths, joinType, endType));
  }

  calcSolutionCapacity(): number {
    let result = 0;
    for (const g of this.#groupList) {
      result +=
        g.endType === EndType.Joined ? g.inPaths.length * 2 : g.inPaths.length;
    }
    return result;
  }

  checkPathsReversed(): boolean {
    let result = false;
    for (const g of this.#groupList) {
      if (g.endType === EndType.Polygon) {
        result = g.pathsReversed;
        break;
      }
    }
    return result;
  }

  #executeInternal(delta: number) {
    if (this.#groupList.length === 0) {
      return;
    }

    // make sure the offset delta is significant
    if (Math.abs(delta) < 0.5) {
      for (const group of this.#groupList) {
        for (const path of group.inPaths) {
          this.#solution.push(path);
        }
      }
      return;
    }

    this.#delta = delta;
    this.#mitLimSqr =
      this.miterLimit <= 1 ? 2.0 : 2.0 / (this.miterLimit * this.miterLimit);

    for (const group of this.#groupList) {
      this.#doGroupOffset(group);
    }

    if (this.#groupList.length === 0) {
      return;
    }

    const pathsReversed = this.checkPathsReversed();
    const fillRule = pathsReversed ? FillRule.Negative : FillRule.Positive;

    const c = new Clipper64();
    c.preserveCollinear = this.preserveCollinear;
    c.reverseSolution = this.reverseSolution !== pathsReversed;
    c.addSubject(this.#solution);
    c.execute(ClipType.Union, fillRule, this.#solution, []);
  }

  execute(delta: number, solution: Paths64) {
    solution.length = 0;
    this.#solution = solution;
    this.#executeInternal(delta);
  }

  #getPerpendic(pt: Point64, norm: PointD): Point64 {
    // TODO check precision
    return pointDToPoint64([
      pt[0] + norm[0] * this.#groupDelta,
      pt[1] + norm[1] * this.#groupDelta,
    ] as PointD);
  }

  #getPerpendicD(pt: Point64, norm: PointD): PointD {
    return [
      pt[0] + norm[0] * this.#groupDelta,
      pt[1] + norm[1] * this.#groupDelta,
    ] as PointD;
  }

  #doBevel(path: Path64, j: number, k: number) {
    // TODO check precision
    let pt1: Point64;
    let pt2: Point64;

    if (j === k) {
      const absDelta = Math.abs(this.#groupDelta);
      pt1 = pointDToPoint64([
        path[j]![0] - absDelta * this.#normals[j]![0],
        path[j]![1] - absDelta * this.#normals[j]![1],
      ] as PointD);
      pt2 = pointDToPoint64([
        path[j]![0] + absDelta * this.#normals[j]![0],
        path[j]![1] + absDelta * this.#normals[j]![1],
      ] as PointD);
    } else {
      pt1 = pointDToPoint64([
        path[j]![0] + this.#groupDelta * this.#normals[k]![0],
        path[j]![1] + this.#groupDelta * this.#normals[k]![1],
      ] as PointD);
      pt2 = pointDToPoint64([
        path[j]![0] + this.#groupDelta * this.#normals[j]![0],
        path[j]![1] + this.#groupDelta * this.#normals[j]![1],
      ] as PointD);
    }

    this.pathOut.push(pt1);
    this.pathOut.push(pt2);
  }

  #doSquare(path: Path64, j: number, k: number) {
    // TODO check PointD/Point64 precision
    let vec: PointD;
    if (j === k) {
      vec = [this.#normals[j]![1], -this.#normals[j]![0]] as PointD;
    } else {
      vec = getAvgUnitVector(
        [-this.#normals[k]![1], this.#normals[k]![0]] as PointD,
        [this.#normals[j]![1], -this.#normals[j]![0]] as PointD,
      );
    }

    const absDelta = Math.abs(this.#groupDelta);
    const ptQ = translatePoint(
      // We are casting a Point64 to a PointD here, this is safe because path[j] must be an integer within the safe range.
      // This is then used as a double for the purposes of the translation math
      path[j]! as unknown as PointD,
      absDelta * vec[0],
      absDelta * vec[1],
    );

    // get perpendicular vertices
    const pt1 = translatePoint(
      ptQ,
      this.#groupDelta * vec[1],
      this.#groupDelta * -vec[0],
    );
    const pt2 = translatePoint(
      ptQ,
      this.#groupDelta * -vec[1],
      this.#groupDelta * vec[0],
    );
    // get 2 vertices along one edge offset
    const pt3 = this.#getPerpendicD(path[k]!, this.#normals[k]!);

    if (j === k) {
      const pt4 = [
        pt3[0] + vec[0] * this.#groupDelta,
        pt3[1] + vec[1] * this.#groupDelta,
      ] as PointD;
      const { ip: pt } = getLineIntersectPtD(pt1, pt2, pt3, pt4);
      //get the second intersect point through reflection
      this.pathOut.push(pointDToPoint64(reflectPoint(pt, ptQ)));
      this.pathOut.push(pointDToPoint64(pt));
    } else {
      const pt4 = this.#getPerpendicD(path[j]!, this.#normals[k]!);
      const { ip: pt } = getLineIntersectPtD(pt1, pt2, pt3, pt4);
      this.pathOut.push(pointDToPoint64(pt));
      //get the second intersect point through reflection
      this.pathOut.push(pointDToPoint64(reflectPoint(pt, ptQ)));
    }
  }

  #doMiter(path: Path64, j: number, k: number, cosA: number) {
    // TODO check for precision
    const q = this.#groupDelta / (cosA + 1);
    this.pathOut.push(
      pointDToPoint64([
        path[j]![0] + (this.#normals[k]![0] + this.#normals[j]![0]) * q,
        path[j]![1] + (this.#normals[k]![1] + this.#normals[j]![1]) * q,
      ] as PointD),
    );
  }

  #doRound(path: Path64, j: number, k: number, angle: number) {
    // TODO check precision (I think this is OK because we're winding up with x,y coords)
    const pt = path[j]!;
    let offsetVec = [
      this.#normals[k]![0] * this.#groupDelta,
      this.#normals[k]![1] * this.#groupDelta,
    ] as PointD;
    if (j === k) {
      offsetVec = negatePtD(offsetVec);
    }
    this.pathOut.push(
      pointDToPoint64([pt[0] + offsetVec[0], pt[1] + offsetVec[1]] as PointD),
    );
    const steps = Math.ceil(this.#stepsPerRad * Math.abs(angle));
    // ie 1 less than steps
    for (let i = 1; i < steps; i++) {
      offsetVec = [
        offsetVec[0] * this.#stepCos - this.#stepSin * offsetVec[1],
        offsetVec[0] * this.#stepSin + offsetVec[1] * this.#stepCos,
      ] as PointD;
      this.pathOut.push(
        pointDToPoint64([pt[0] + offsetVec[0], pt[1] + offsetVec[1]] as PointD),
      );
    }
    this.pathOut.push(this.#getPerpendic(pt, this.#normals[j]!));
  }

  #buildNormals(path: Path64) {
    const cnt = path.length;
    this.#normals = [];
    if (cnt === 0) {
      return;
    }
    for (let i = 0; i < cnt - 1; i++) {
      // max value for i is path.length-2
      this.#normals.push(getUnitNormal(path[i]!, path[i + 1]!));
    }
    this.#normals.push(getUnitNormal(path[cnt - 1]!, path[0]!));
  }

  /**
   * Caller must set k to j after calling this method
   */
  #offsetPoint(_group: Group, path: Path64, j: number, k: number): void {
    if (pointEqual(path[j]!, path[k]!)) {
      return;
    }
    // Let A = change in angle where edges join
    // A == 0: ie no change in angle (flat join)
    // A == PI: edges 'spike'
    // sin(A) < 0: right turning
    // cos(A) < 0: change in angle is more than 90 degree
    let sinA = crossProductD(this.#normals[j]!, this.#normals[k]!);
    const cosA = dotProductD(this.#normals[j]!, this.#normals[k]!);
    if (sinA > 1.0) {
      sinA = 1.0;
    } else if (sinA < -1.0) {
      sinA = -1.0;
    }
    if (Math.abs(this.#groupDelta) < TOLERANCE) {
      this.pathOut.push(path[j]!);
      return;
    }

    // test for concavity first (#593)
    if (cosA > -0.999 && sinA * this.#groupDelta < 0) {
      // is concave
      // by far the simplest way to construct concave joins, especially those joining very
      // short segments, is to insert 3 points that produce negative regions. These regions
      // will be removed later by the finishing union operation. This is also the best way
      // to ensure that path reversals (ie over-shrunk paths) are removed.
      this.pathOut.push(this.#getPerpendic(path[j]!, this.#normals[k]!));
      this.pathOut.push(path[j]!); // (#405, #873, #916)
      this.pathOut.push(this.#getPerpendic(path[j]!, this.#normals[j]!));
    } else if (cosA > 0.999 && this.#joinType !== JoinType.Round) {
      // almost straight - less than 2.5 degree (#424, #482, #526 & #724)
      this.#doMiter(path, j, k, cosA);
    } else {
      switch (this.#joinType) {
        case JoinType.Miter:
          if (cosA > this.#mitLimSqr - 1) {
            this.#doMiter(path, j, k, cosA);
          } else {
            this.#doSquare(path, j, k);
          }
          break;
        case JoinType.Round:
          this.#doRound(path, j, k, Math.atan2(sinA, cosA));
          break;
        case JoinType.Bevel:
          this.#doBevel(path, j, k);
          break;
        default:
          this.#doSquare(path, j, k);
          break;
      }
    }
  }

  #offsetPolygon(group: Group, path: Path64): void {
    this.pathOut = [];
    const cnt = path.length;
    let prev = cnt - 1;
    for (let i = 0; i < cnt; i++) {
      this.#offsetPoint(group, path, i, prev);
      prev = i;
    }
    this.#solution.push(this.pathOut);
  }

  #offsetOpenJoined(group: Group, path: Path64): void {
    this.#offsetPolygon(group, path);
    path = Array.from(path).reverse();
    this.#buildNormals(path);
    this.#offsetPolygon(group, path);
  }

  #offsetOpenPath(group: Group, path: Path64): void {
    this.pathOut = [];
    const highI = path.length - 1;

    // do the line start cap
    if (Math.abs(this.#groupDelta) < TOLERANCE) {
      this.pathOut.push(path[0]!);
    } else {
      switch (this.#endType) {
        case EndType.Butt:
          this.#doBevel(path, 0, 0);
          break;
        case EndType.Round:
          this.#doRound(path, 0, 0, Math.PI);
          break;
        default:
          this.#doSquare(path, 0, 0);
          break;
      }
    }

    // offset the left side going forward
    for (let i = 0, k = 0; i < highI; i++) {
      this.#offsetPoint(group, path, i, k);
      k = i;
    }

    // reverse normals ...
    for (let i = highI; i > 0; i--) {
      this.#normals[i] = [
        -this.#normals[i - 1]![0],
        -this.#normals[i - 1]![1],
      ] as PointD;
    }
    this.#normals[0] = this.#normals[highI]!;

    // do the line end cap
    if (Math.abs(this.#groupDelta) < TOLERANCE) {
      this.pathOut.push(path[highI]!);
    } else {
      switch (this.#endType) {
        case EndType.Butt:
          this.#doBevel(path, highI, highI);
          break;
        case EndType.Round:
          this.#doRound(path, highI, highI, Math.PI);
          break;
        default:
          this.#doSquare(path, highI, highI);
          break;
      }
    }

    // offset the left side going back
    for (let i = highI - 1, k = highI; i > 0; i--) {
      this.#offsetPoint(group, path, i, k);
      k = i;
    }
    this.#solution.push(this.pathOut);
  }

  #doGroupOffset(group: Group) {
    if (group.endType === EndType.Polygon) {
      // a straight path (2 points) can now also be 'polygon' offset
      // where the ends will be treated as (180 deg.) joins
      if (group.lowestPathIdx < 0) {
        this.#delta = Math.abs(this.#delta);
      }
      this.#groupDelta = group.pathsReversed ? -this.#delta : this.#delta;
    } else {
      this.#groupDelta = Math.abs(this.#delta);
    }

    const absDelta = Math.abs(this.#groupDelta);
    this.#joinType = group.joinType;
    this.#endType = group.endType;
    if (group.joinType === JoinType.Round || group.endType === EndType.Round) {
      const arcTol =
        this.arcTolerance > 0.01 ? this.arcTolerance : absDelta * ARC_CONST;
      const stepsPer360 = Math.PI / Math.acos(1 - arcTol / absDelta);
      this.#stepSin = Math.sin((2 * Math.PI) / stepsPer360);
      this.#stepCos = Math.cos((2 * Math.PI) / stepsPer360);
      if (this.#groupDelta < 0.0) {
        this.#stepSin = -this.#stepSin;
      }
      this.#stepsPerRad = stepsPer360 / (2 * Math.PI);
    }

    for (const p of group.inPaths) {
      this.pathOut = [];
      const cnt = p.length;

      switch (cnt) {
        case 1: {
          const pt = p[0]!;

          // single vertex so build a circle or square ...
          if (group.endType === EndType.Round) {
            const steps = Math.ceil(this.#stepsPerRad * 2 * Math.PI);
            this.pathOut = ellipse(pt, absDelta, absDelta, steps);
          } else {
            const d = Math.ceil(this.#groupDelta);
            this.pathOut = rect64ToPath(
              [pt[0] - d, pt[1] - d] as Point64,
              [pt[0] + d, pt[1] + d] as Point64,
            );
          }

          this.#solution.push(this.pathOut);
          continue; // end of offsetting a single point
        }
        case 2:
          if (group.endType === EndType.Joined) {
            this.#endType =
              group.joinType === JoinType.Round
                ? EndType.Round
                : EndType.Square;
          }
          break;
      }

      this.#buildNormals(p);
      switch (this.#endType) {
        case EndType.Polygon:
          this.#offsetPolygon(group, p);
          break;
        case EndType.Joined:
          this.#offsetOpenJoined(group, p);
          break;
        default:
          this.#offsetOpenPath(group, p);
          break;
      }
    }
  }
}
