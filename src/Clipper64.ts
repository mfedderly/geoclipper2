import type { Active } from "./Active.ts";
import { addPathsToVertexList } from "./addPathsToVertexList.ts";
import { areaOutPt } from "./areaOutPt.ts";
import { areaTriangle } from "./areaTriangle.ts";
import { ClipType } from "./ClipType.ts";
import { disposeOutPt } from "./disposeOutPt.ts";
import { dotProduct64 } from "./dotProduct64.ts";
import { edgesAdjacentInAEL } from "./edgesAdjacentInAEL.ts";
import { extractFromSEL } from "./extractFromSEL.ts";
import { FillRule } from "./FillRule.ts";
import { findEdgeWithMatchingLocMin } from "./findEdgeWithMatchingLocMin.ts";
import { fixOutRecPts } from "./fixOutRecPts.ts";
import { getClosestPtOnSegment } from "./getClosestPtOnSegment.ts";
import { getCurrYMaximaVertex } from "./getCurrYMaximaVertex.ts";
import { getCurrYMaximaVertex_Open } from "./getCurrYMaximaVertex_Open.ts";
import { getDx } from "./getDx.ts";
import { getLastOp } from "./getLastOp.ts";
import { getLineIntersectPt64 } from "./getLineIntersectPt64.ts";
import { getMaximaPair } from "./getMaximaPair.ts";
import { getPrevHotEdge } from "./getPrevHotEdge.ts";
import { getRealOutRec } from "./getRealOutRec.ts";
import { HorzJoin } from "./HorzJoin.ts";
import { HorzSegment } from "./HorzSegment.ts";
import { horzSegSort } from "./horzSegSort.ts";
import { insert1Before2InSEL } from "./insert1Before2InSEL.ts";
import { insertRightEdge } from "./insertRightEdge.ts";
import { intersectListSort } from "./intersectListSort.ts";
import { IntersectNode } from "./IntersectNode.ts";
import { isCollinear } from "./isCollinear.ts";
import { isFront } from "./isFront.ts";
import { isHeadingLeftHorz } from "./isHeadingLeftHorz.ts";
import { isHeadingRightHorz } from "./isHeadingRightHorz.ts";
import { isHorizontal } from "./isHorizontal.ts";
import { isHotEdge } from "./isHotEdge.ts";
import { isJoined } from "./isJoined.ts";
import { isMaxima } from "./isMaxima.ts";
import { isOdd } from "./isOdd.ts";
import { isOpen } from "./isOpen.ts";
import { isOpenEndActive } from "./isOpenEndActive.ts";
import { isOpenEndVertex } from "./isOpenEndVertex.ts";
import { isValidAelOrder } from "./isValidAelOrder.ts";
import { isValidClosedPath } from "./isValidClosedPath.ts";
import { isVerySmallTriangle } from "./isVerySmallTriangle.ts";
import { JoinWith } from "./JoinWith.ts";
import type { LocalMinima } from "./LocalMinima.ts";
import { locMinSorter } from "./locMinSorter.ts";
import { newActive } from "./newActive.ts";
import { nextVertex } from "./nextVertex.ts";
import { OutPt } from "./OutPt.ts";
import type { OutRec } from "./OutRec.ts";
import { outrecIsAscending } from "./outrecIsAscending.ts";
import { PathType } from "./PathType.ts";
import { perpendicDistFromLineSqrd64 } from "./perpendicDistFromLineSqrd64.ts";
import { pointEqual } from "./pointEqual.ts";
import { resetHorzDirection } from "./resetHorzDirection.ts";
import { segsIntersect } from "./segsIntersect.ts";
import { setOwner } from "./setOwner.ts";
import { setSides } from "./setSides.ts";
import { swapFrontBackSides } from "./swapFrontBackSides.ts";
import { swapOutrecs } from "./swapOutrecs.ts";
import { topX } from "./topX.ts";
import { trimHorz } from "./trimHorz.ts";
import type { Path64, Paths64, Point64 } from "./types.ts";
import { uncoupleOutRec } from "./uncoupleOutRec.ts";
import { updateHorzSegment } from "./updateHorzSegment.ts";
import type { Vertex } from "./Vertex.ts";
import { VertexFlags } from "./VertexFlags.ts";

export class Clipper64 {
  #clipType: ClipType = ClipType.NoClip;
  #fillRule: FillRule = FillRule.EvenOdd;
  #actives: Active | undefined;
  #sel: Active | undefined;
  #minimaList: LocalMinima[] = [];
  #intersectList: IntersectNode[] = [];
  #vertexList: Vertex[] = [];
  #outrecList: OutRec[] = [];
  /**
   * This is a sorted list of unique Y values.
   * In clipper2 this is a long[], but it is storing Y coordinates, which must be within SAFE_INTEGER
   */
  #scanlineList: number[] = [];
  #horzSegList: HorzSegment[] = [];
  #horzJoinList: HorzJoin[] = [];
  #currentLocMin = 0;
  // NOTE: this is a Y coordinate. Although it starts as a long in the clipper2 source, it should remain within the SAFE_INTEGER range
  #currentBotY = 0;
  #isSortedMinimaList = true;
  #hasOpenPaths = false;
  #succeeded = true;
  preserveCollinear = true;
  reverseSolution = false;

  addSubject(paths: Paths64) {
    this.addPaths(paths, PathType.Subject);
  }

  addPaths(paths: Paths64, polytype: PathType, isOpen = false) {
    if (isOpen) {
      this.#hasOpenPaths = true;
    }
    this.#isSortedMinimaList = false;
    addPathsToVertexList(
      paths,
      polytype,
      isOpen,
      this.#minimaList,
      this.#vertexList,
    );
  }

  execute(
    clipType: ClipType,
    fillRule: FillRule,
    solutionClosed: Paths64,
    solutionOpen: Paths64,
  ) {
    solutionClosed.length = 0;
    solutionOpen.length = 0;
    try {
      this.#executeInternal(clipType, fillRule);
      this.#buildPaths(solutionClosed, solutionOpen);
    } catch {
      this.#succeeded = false;
    }
    this.#clearSolutionOnly();
    return this.#succeeded;
  }

  #executeInternal(ct: ClipType, fillRule: FillRule) {
    if (ct === ClipType.NoClip) {
      return;
    }
    this.#fillRule = fillRule;
    this.#clipType = ct;
    this.#reset();
    let { y, result } = this.#popScanline();
    if (!result) {
      return;
    }
    while (this.#succeeded) {
      this.#insertLocalMinimaIntoAEL(y);
      for (;;) {
        const { ae, result } = this.#popHorz();
        if (!result) {
          break;
        }
        this.#doHorizontal(ae);
      }
      if (this.#horzSegList.length > 0) {
        this.#convertHorzSegsToJoins();
        this.#horzSegList.length = 0;
      }
      this.#currentBotY = y; // bottom of scanbeam
      ({ y, result } = this.#popScanline());
      if (!result) {
        break; // y new top of scanbeam
      }
      this.#doIntersections(y);
      this.#doTopOfScanbeam(y);
      for (;;) {
        const { ae, result } = this.#popHorz();
        if (!result) {
          break;
        }
        this.#doHorizontal(ae);
      }
    }
    if (this.#succeeded) {
      this.#processHorzJoins();
    }
  }

  #reset() {
    if (!this.#isSortedMinimaList) {
      this.#minimaList.sort(locMinSorter);
      this.#isSortedMinimaList = true;
    }

    for (let i = this.#minimaList.length - 1; i >= 0; i--) {
      this.#scanlineList.push(this.#minimaList[i]!.vertex.pt[1]);
    }

    this.#currentBotY = 0;
    this.#currentLocMin = 0;
    this.#actives = undefined;
    this.#sel = undefined;
    this.#succeeded = true;
  }

  #popScanline(): { result: true; y: number } | { result: false; y: number } {
    let cnt = this.#scanlineList.length - 1;
    if (cnt < 0) {
      return { result: false, y: 0 };
    }

    const y = this.#scanlineList[cnt]!;
    this.#scanlineList.splice(cnt--, 1);
    // remove duplicates while you return
    while (cnt >= 0 && y === this.#scanlineList[cnt]) {
      this.#scanlineList.splice(cnt--, 1);
    }
    return { result: true, y };
  }

  #insertLocalMinimaIntoAEL(botY: number) {
    // NOTE botY is originally a long, but as its a Y coordinate should be required to be within SAFE_INTEGER range
    // Add any local minima (if any) at botY ...
    // NB horizontal local minima edges should contain locMin.vertex.prev
    while (this.#hasLocMinAtY(botY)) {
      const localMinima = this.#popLocalMinima();
      let leftBound: Active | undefined;

      if (
        (localMinima.vertex.flags & VertexFlags.OpenStart) !==
        VertexFlags.None
      ) {
        leftBound = undefined;
      } else {
        leftBound = newActive(localMinima, -1, localMinima.vertex.prev!);
      }

      let rightBound: Active | undefined;
      if (
        (localMinima.vertex.flags & VertexFlags.OpenEnd) !==
        VertexFlags.None
      ) {
        rightBound = undefined;
      } else {
        rightBound = newActive(localMinima, 1, localMinima.vertex.next!); // i.e. ascending
      }

      // Currently LeftB is just the descending bound and RightB is the ascending.
      // Now if the LeftB isn't on the left of RightB then we need swap them.
      if (leftBound != null && rightBound != null) {
        if (isHorizontal(leftBound)) {
          if (isHeadingRightHorz(leftBound)) {
            // swap actives
            const tmp = rightBound;
            rightBound = leftBound;
            leftBound = tmp;
          }
        } else if (isHorizontal(rightBound)) {
          if (isHeadingLeftHorz(rightBound)) {
            // swap actives
            const tmp = rightBound;
            rightBound = leftBound;
            leftBound = tmp;
          }
        } else if (leftBound.dx < rightBound.dx) {
          // swap actives
          const tmp = rightBound;
          rightBound = leftBound;
          leftBound = tmp;
          //so when leftBound has windDx == 1, the polygon will be oriented
          //counter-clockwise in Cartesian coords (clockwise with inverted Y).
        }
      } else if (leftBound == null) {
        leftBound = rightBound;
        rightBound = undefined;
      }

      let contributing: boolean;
      leftBound!.isLeftBound = true;
      this.#insertLeftEdge(leftBound!);
      if (isOpen(leftBound!)) {
        this.#setWindCountForOpenPathEdge(leftBound!);
        contributing = this.#isContributingOpen(leftBound!);
      } else {
        this.#setWindCountForClosedPathEdge(leftBound!);
        contributing = this.#isContributingClosed(leftBound!);
      }

      if (rightBound != null) {
        rightBound.windCount = leftBound!.windCount;
        rightBound.windCount2 = leftBound!.windCount2;
        insertRightEdge(leftBound!, rightBound);

        if (contributing) {
          this.#addLocalMinPoly(leftBound!, rightBound, leftBound!.bot, true);
          if (!isHorizontal(leftBound!)) {
            this.#checkJoinLeft(leftBound!, leftBound!.bot);
          }
        }

        while (
          rightBound.nextInAEL != null &&
          isValidAelOrder(rightBound.nextInAEL, rightBound)
        ) {
          this.#intersectEdges(
            rightBound,
            rightBound.nextInAEL,
            rightBound.bot,
          );
          this.#swapPositionsInAEL(rightBound, rightBound.nextInAEL);
        }

        if (isHorizontal(rightBound)) {
          this.#pushHorz(rightBound);
        } else {
          this.#checkJoinRight(rightBound, rightBound.bot);
          this.#insertScanline(rightBound.top[1]);
        }
      } else if (contributing) {
        this.#startOpenPath(leftBound!, leftBound!.bot);
      }

      if (isHorizontal(leftBound!)) {
        this.#pushHorz(leftBound!);
      } else {
        this.#insertScanline(leftBound!.top[1]);
      }
    }
  }

  #hasLocMinAtY(y: number) {
    return (
      this.#currentLocMin < this.#minimaList.length &&
      this.#minimaList[this.#currentLocMin]!.vertex.pt[1] === y
    );
  }

  #popLocalMinima() {
    return this.#minimaList[this.#currentLocMin++]!;
  }

  #insertLeftEdge(ae: Active) {
    if (this.#actives == null) {
      ae.prevInAEL = undefined;
      ae.nextInAEL = undefined;
      this.#actives = ae;
    } else if (!isValidAelOrder(this.#actives, ae)) {
      ae.prevInAEL = undefined;
      ae.nextInAEL = this.#actives;
      this.#actives.prevInAEL = ae;
      this.#actives = ae;
    } else {
      let ae2 = this.#actives;
      while (ae2.nextInAEL != null && isValidAelOrder(ae2.nextInAEL, ae)) {
        ae2 = ae2.nextInAEL;
      }
      //don't separate joined edges
      if (ae2.joinWith === JoinWith.Right) {
        ae2 = ae2.nextInAEL!;
      }
      ae.nextInAEL = ae2.nextInAEL;
      if (ae2.nextInAEL != null) {
        ae2.nextInAEL.prevInAEL = ae;
      }
      ae.prevInAEL = ae2;
      ae2.nextInAEL = ae;
    }
  }

  #setWindCountForOpenPathEdge(ae: Active) {
    let ae2 = this.#actives;
    if (this.#fillRule === FillRule.EvenOdd) {
      let cnt1 = 0;
      let cnt2 = 0;
      while (ae2 !== ae) {
        if (ae2!.localMin.polytype === PathType.Clip) {
          cnt2++;
        } else if (!isOpen(ae2!)) {
          cnt1++;
        }
        ae2 = ae2!.nextInAEL;
      }

      ae.windCount = isOdd(cnt1) ? 1 : 0;
      ae.windCount2 = isOdd(cnt2) ? 1 : 0;
    } else {
      while (ae2 !== ae) {
        if (ae2!.localMin.polytype === PathType.Clip) {
          ae.windCount += ae2!.windDx;
        } else if (isOpen(ae2!)) {
          ae.windCount += ae2!.windDx;
        }
        ae2 = ae2!.nextInAEL;
      }
    }
  }

  #isContributingOpen(ae: Active): boolean {
    let isInClip: boolean;
    let isInSubj: boolean;
    switch (this.#fillRule) {
      case FillRule.Positive:
        isInSubj = ae.windCount > 0;
        isInClip = ae.windCount2 > 0;
        break;
      case FillRule.Negative:
        isInSubj = ae.windCount < 0;
        isInClip = ae.windCount2 < 0;
        break;
      default:
        isInSubj = ae.windCount !== 0;
        isInClip = ae.windCount2 !== 0;
        break;
    }

    let result: boolean;
    switch (this.#clipType) {
      case ClipType.Intersection:
        result = isInClip;
        break;
      case ClipType.Union:
        result = !isInSubj && !isInClip;
        break;
      default:
        result = !isInClip;
        break;
    }

    return result;
  }

  #setWindCountForClosedPathEdge(ae: Active) {
    // Wind counts refer to polygon regions not edges, so here an edge's WindCnt
    // indicates the higher of the wind counts for the two regions touching the
    // edge. (nb: Adjacent regions can only ever have their wind counts differ by
    // one. Also, open paths have no meaningful wind directions or counts.)

    let ae2 = ae.prevInAEL;
    // find the nearest closed path edge of the same PolyType in AEL (heading left)
    const pt = ae.localMin.polytype;
    while (ae2 != null && (ae2.localMin.polytype !== pt || isOpen(ae2))) {
      ae2 = ae2.prevInAEL;
    }

    if (ae2 == null) {
      ae.windCount = ae.windDx;
      ae2 = this.#actives;
    } else if (this.#fillRule === FillRule.EvenOdd) {
      ae.windCount = ae.windDx;
      ae.windCount2 = ae2.windCount2;
      ae2 = ae2.nextInAEL;
    } else {
      // NonZero, positive, or negative filling here ...
      // when e2's WindCnt is in the SAME direction as its WindDx,
      // then polygon will fill on the right of 'e2' (and 'e' will be inside)
      // nb: neither e2.WindCnt nor e2.WindDx should ever be 0.
      if (ae2.windCount * ae2.windDx < 0) {
        // opposite directions so 'ae' is outside 'ae2' ...
        if (Math.abs(ae2.windCount) > 1) {
          // outside prev poly but still inside another.
          if (ae2.windDx * ae.windDx < 0) {
            // reversing direction so use the same WC
            ae.windCount = ae2.windCount;
          } else {
            // otherwise keep 'reducing' the WC by 1 (i.e. towards 0) ...
            ae.windCount = ae2.windCount + ae.windDx;
          }
        } else {
          // now outside all polys of same polytype so set own WC ...
          ae.windCount = isOpen(ae) ? 1 : ae.windDx;
        }
      } else {
        //'ae' must be inside 'ae2'
        if (ae2.windDx * ae.windDx < 0) {
          // reversing direction so use the same WC
          ae.windCount = ae2.windCount;
        } else {
          // otherwise keep 'increasing' the WC by 1 (i.e. away from 0) ...
          ae.windCount = ae2.windCount + ae.windDx;
        }
      }

      ae.windCount2 = ae2.windCount2;
      ae2 = ae2.nextInAEL; // i.e. get ready to calc WindCnt2
    }

    // update windCount2 ...
    if (this.#fillRule === FillRule.EvenOdd) {
      while (ae2 !== ae) {
        if (ae2!.localMin.polytype !== pt && !isOpen(ae2!)) {
          ae.windCount2 = ae.windCount2 === 0 ? 1 : 0;
        }
        ae2 = ae2!.nextInAEL;
      }
    } else {
      while (ae2 !== ae) {
        if (ae2!.localMin.polytype !== pt && !isOpen(ae2!)) {
          ae.windCount2 += ae2!.windDx;
        }
        ae2 = ae2!.nextInAEL;
      }
    }
  }

  #isContributingClosed(ae: Active) {
    switch (this.#fillRule) {
      case FillRule.Positive:
        if (ae.windCount !== 1) {
          return false;
        }
        break;
      case FillRule.Negative:
        if (ae.windCount !== -1) {
          return false;
        }
        break;
      case FillRule.NonZero:
        if (Math.abs(ae.windCount) !== 1) {
          return false;
        }
        break;
    }

    switch (this.#clipType) {
      case ClipType.Intersection:
        switch (this.#fillRule) {
          case FillRule.Positive:
            return ae.windCount2 > 0;
          case FillRule.Negative:
            return ae.windCount2 < 0;
          default:
            return ae.windCount2 !== 0;
        }
      case ClipType.Union:
        switch (this.#fillRule) {
          case FillRule.Positive:
            return ae.windCount2 <= 0;
          case FillRule.Negative:
            return ae.windCount2 >= 0;
          default:
            return ae.windCount2 === 0;
        }
      case ClipType.Difference: {
        let result: boolean;
        switch (this.#fillRule) {
          case FillRule.Positive:
            result = ae.windCount2 <= 0;
            break;
          case FillRule.Negative:
            result = ae.windCount2 >= 0;
            break;
          default:
            result = ae.windCount2 === 0;
            break;
        }
        return ae.localMin.polytype === PathType.Subject ? result : !result;
      }
      case ClipType.Xor:
        return true; // XOr is always contributing unless open
      default:
        return false;
    }
  }

  #addLocalMinPoly(ae1: Active, ae2: Active, pt: Point64, isNew = false) {
    const outrec = this.#newOutRec();
    ae1.outrec = outrec;
    ae2.outrec = outrec;

    if (isOpen(ae1)) {
      outrec.owner = undefined;
      outrec.isOpen = true;
      if (ae1.windDx > 0) {
        setSides(outrec, ae1, ae2);
      } else {
        setSides(outrec, ae2, ae1);
      }
    } else {
      outrec.isOpen = false;
      const prevHotEdge = getPrevHotEdge(ae1);
      // e.windDx is the winding direction of the **input** paths
      // and unrelated to the winding direction of output polygons.
      // Output orientation is determined by e.outrec.frontE which is
      // the ascending edge (see AddLocalMinPoly).
      if (prevHotEdge != null) {
        outrec.owner = prevHotEdge.outrec;
        if (outrecIsAscending(prevHotEdge) === isNew) {
          setSides(outrec, ae2, ae1);
        } else {
          setSides(outrec, ae1, ae2);
        }
      } else {
        outrec.owner = undefined;
        if (isNew) {
          setSides(outrec, ae1, ae2);
        } else {
          setSides(outrec, ae2, ae1);
        }
      }
    }

    const op = new OutPt(pt, outrec);
    outrec.pts = op;
    return op;
  }

  #checkJoinLeft(e: Active, pt: Point64, checkCurrX = false) {
    const prev = e.prevInAEL;
    if (
      prev == null ||
      !isHotEdge(e) ||
      !isHotEdge(prev) ||
      isHorizontal(e) ||
      isHorizontal(prev) ||
      isOpen(e) ||
      isOpen(prev)
    ) {
      return;
    }

    // NOTE: See above for a more detailed note on the +2 safety here, but it is never stored and even with
    // the y coordinates being Number.MAX_SAFE_INTEGER this comparison will still return the expected results
    if (
      (pt[1] < e.top[1] + 2 ||
        pt[1] < prev.top[1] + 2) /* avoid trivial joins */ &&
      (e.bot[1] > pt[1] || prev.bot[1] > pt[1]) /* #490 */
    ) {
      return;
    }
    if (checkCurrX) {
      if (perpendicDistFromLineSqrd64(pt, prev.bot, prev.top) > 0.25) {
        return;
      }
    } else if (e.curX !== prev.curX) {
      return;
    }
    if (!isCollinear(e.top, pt, prev.top)) {
      return;
    }

    if (e.outrec!.idx === prev.outrec!.idx) {
      this.#addLocalMaxPoly(prev, e, pt);
    } else if (e.outrec!.idx < prev.outrec!.idx) {
      this.#joinOutrecPaths(e, prev);
    } else {
      this.#joinOutrecPaths(prev, e);
    }
    prev.joinWith = JoinWith.Right;
    e.joinWith = JoinWith.Left;
  }

  #addLocalMaxPoly(ae1: Active, ae2: Active, pt: Point64) {
    if (isJoined(ae1)) {
      this.#split(ae1, pt);
    }
    if (isJoined(ae2)) {
      this.#split(ae2, pt);
    }

    if (isFront(ae1) === isFront(ae2)) {
      if (isOpenEndActive(ae1)) {
        swapFrontBackSides(ae1.outrec!);
      } else if (isOpenEndActive(ae2)) {
        swapFrontBackSides(ae2.outrec!);
      } else {
        this.#succeeded = false;
        return;
      }
    }

    const result = this.#addOutPt(ae1, pt);
    if (ae1.outrec === ae2.outrec) {
      const outrec = ae1.outrec!;
      outrec.pts = result;
      uncoupleOutRec(ae1);
    } else if (isOpen(ae1)) {
      // and to preserve the winding orientation of outrec ...
      if (ae1.windDx < 0) {
        this.#joinOutrecPaths(ae1, ae2);
      } else {
        this.#joinOutrecPaths(ae2, ae1);
      }
    } else if (ae1.outrec!.idx < ae2.outrec!.idx) {
      this.#joinOutrecPaths(ae1, ae2);
    } else {
      this.#joinOutrecPaths(ae2, ae1);
    }
    return result;
  }

  #split(e: Active, currPt: Point64) {
    if (e.joinWith === JoinWith.Right) {
      e.joinWith = JoinWith.None;
      e.nextInAEL!.joinWith = JoinWith.None;
      this.#addLocalMinPoly(e, e.nextInAEL!, currPt, true);
    } else {
      e.joinWith = JoinWith.None;
      e.prevInAEL!.joinWith = JoinWith.None;
      this.#addLocalMinPoly(e.prevInAEL!, e, currPt, true);
    }
  }

  #addOutPt(ae: Active, pt: Point64) {
    // Outrec.OutPts: a circular doubly-linked-list of POutPt where ...
    // opFront[.Prev]* ~~~> opBack & opBack == opFront.Next

    const outrec = ae.outrec!;
    const toFront = isFront(ae);
    const opFront = outrec.pts!;
    const opBack = opFront.next!;

    if (toFront && pointEqual(pt, opFront.pt)) {
      return opFront;
    } else if (!toFront && pointEqual(pt, opBack.pt)) {
      return opBack;
    }

    const newOp = new OutPt(pt, outrec);
    opBack.prev = newOp;
    newOp.prev = opFront;
    newOp.next = opBack;
    opFront.next = newOp;
    if (toFront) {
      outrec.pts = newOp;
    }
    return newOp;
  }

  #joinOutrecPaths(ae1: Active, ae2: Active) {
    // join ae2 outrec path onto ae1 outrec path and then delete ae2 outrec path
    // pointers. (NB Only very rarely do the joining ends share the same coords.)
    const p1Start = ae1.outrec!.pts!;
    const p2Start = ae2.outrec!.pts!;
    const p1End = p1Start.next!;
    const p2End = p2Start.next!;
    if (isFront(ae1)) {
      p2End.prev = p1Start;
      p1Start.next = p2End;
      p2Start.next = p1End;
      p1End.prev = p2Start;
      ae1.outrec!.pts = p2Start;
      // nb: if IsOpen(e1) then e1 & e2 must be a 'maximaPair'
      ae1.outrec!.frontEdge = ae2.outrec!.frontEdge;
      if (ae1.outrec!.frontEdge != null) {
        ae1.outrec!.frontEdge.outrec = ae1.outrec;
      }
    } else {
      p1End.prev = p2Start;
      p2Start.next = p1End;
      p1Start.next = p2End;
      p2End.prev = p1Start;

      ae1.outrec!.backEdge = ae2.outrec!.backEdge;
      if (ae1.outrec!.backEdge != null) {
        ae1.outrec!.backEdge.outrec = ae1.outrec;
      }
    }

    // after joining, the ae2.OutRec must contains no vertices ...
    ae2.outrec!.frontEdge = undefined;
    ae2.outrec!.backEdge = undefined;
    ae2.outrec!.pts = undefined;
    ae1.outrec!.outPtCount += ae2.outrec!.outPtCount;
    setOwner(ae2.outrec!, ae1.outrec!);

    if (isOpenEndActive(ae1)) {
      ae2.outrec!.pts = ae1.outrec!.pts;
      ae1.outrec!.pts = undefined;
    }

    // and ae1 and ae2 are maxima and are about to be dropped from the Actives list.
    ae1.outrec = undefined;
    ae2.outrec = undefined;
  }

  #intersectEdges(ae1: Active, ae2: Active, pt: Point64) {
    // MANAGE OPEN PATH INTERSECTIONS SEPARATELY ...
    if (this.#hasOpenPaths && (isOpen(ae1) || isOpen(ae2))) {
      if (isOpen(ae1) && isOpen(ae2)) {
        return;
      }
      // the following line avoids duplicating quite a bit of code
      if (isOpen(ae2)) {
        // swap actives
        const tmp = ae1;
        ae1 = ae2;
        ae2 = tmp;
      }
      if (isJoined(ae2)) {
        this.#split(ae2, pt); //needed for safety
      }

      if (this.#clipType === ClipType.Union) {
        if (!isHotEdge(ae2)) {
          return;
        }
      } else if (ae2.localMin.polytype === PathType.Subject) {
        return;
      }

      switch (this.#fillRule) {
        case FillRule.Positive:
          if (ae2.windCount !== 1) {
            return;
          }
          break;
        case FillRule.Negative:
          if (ae2.windCount !== -1) {
            return;
          }
          break;
        default:
          if (Math.abs(ae2.windCount) !== 1) {
            return;
          }
          break;
      }

      // toggle contribution ...
      if (isHotEdge(ae1)) {
        this.#addOutPt(ae1, pt);
        if (isFront(ae1)) {
          ae1.outrec!.frontEdge = undefined;
        } else {
          ae1.outrec!.backEdge = undefined;
        }
        ae1.outrec = undefined;
      }

      // horizontal edges can pass under open paths at a LocMins
      else if (
        pointEqual(pt, ae1.localMin.vertex.pt) &&
        !isOpenEndVertex(ae1.localMin.vertex)
      ) {
        // find the other side of the LocMin and
        // if it's 'hot' join up with it ...
        const ae3 = findEdgeWithMatchingLocMin(ae1);
        if (ae3 != null && isHotEdge(ae3)) {
          ae1.outrec = ae3.outrec;
          if (ae1.windDx > 0) setSides(ae3.outrec!, ae1, ae3);
          else setSides(ae3.outrec!, ae3, ae1);
          return;
        }

        this.#startOpenPath(ae1, pt);
      } else {
        this.#startOpenPath(ae1, pt);
      }
      return;
    }

    // MANAGING CLOSED PATHS FROM HERE ON

    if (isJoined(ae1)) {
      this.#split(ae1, pt);
    }
    if (isJoined(ae2)) {
      this.#split(ae2, pt);
    }

    // UPDATE WINDING COUNTS...
    let oldE1WindCount;
    let oldE2WindCount;
    if (ae1.localMin.polytype === ae2.localMin.polytype) {
      if (this.#fillRule === FillRule.EvenOdd) {
        oldE1WindCount = ae1.windCount;
        ae1.windCount = ae2.windCount;
        ae2.windCount = oldE1WindCount;
      } else {
        if (ae1.windCount + ae2.windDx === 0) {
          ae1.windCount = -ae1.windCount;
        } else {
          ae1.windCount += ae2.windDx;
        }
        if (ae2.windCount - ae1.windDx === 0) {
          ae2.windCount = -ae2.windCount;
        } else {
          ae2.windCount -= ae1.windDx;
        }
      }
    } else {
      if (this.#fillRule !== FillRule.EvenOdd) {
        ae1.windCount2 += ae2.windDx;
      } else {
        ae1.windCount2 = ae1.windCount2 === 0 ? 1 : 0;
      }
      if (this.#fillRule !== FillRule.EvenOdd) {
        ae2.windCount2 -= ae1.windDx;
      } else {
        ae2.windCount2 = ae2.windCount2 === 0 ? 1 : 0;
      }
    }

    switch (this.#fillRule) {
      case FillRule.Positive:
        oldE1WindCount = ae1.windCount;
        oldE2WindCount = ae2.windCount;
        break;
      case FillRule.Negative:
        oldE1WindCount = -ae1.windCount;
        oldE2WindCount = -ae2.windCount;
        break;
      default:
        oldE1WindCount = Math.abs(ae1.windCount);
        oldE2WindCount = Math.abs(ae2.windCount);
        break;
    }

    const e1WindCountIs0or1 = oldE1WindCount === 0 || oldE1WindCount === 1;
    const e2WindCountIs0or1 = oldE2WindCount === 0 || oldE2WindCount === 1;

    if (
      (!isHotEdge(ae1) && !e1WindCountIs0or1) ||
      (!isHotEdge(ae2) && !e2WindCountIs0or1)
    ) {
      return;
    }

    // NOW PROCESS THE INTERSECTION ...

    // if both edges are 'hot' ...
    if (isHotEdge(ae1) && isHotEdge(ae2)) {
      if (
        (oldE1WindCount !== 0 && oldE1WindCount !== 1) ||
        (oldE2WindCount !== 0 && oldE2WindCount !== 1) ||
        (ae1.localMin.polytype !== ae2.localMin.polytype &&
          this.#clipType !== ClipType.Xor)
      ) {
        this.#addLocalMaxPoly(ae1, ae2, pt);
      } else if (isFront(ae1) || ae1.outrec === ae2.outrec) {
        // this 'else if' condition isn't strictly needed but
        // it's sensible to split polygons that only touch at
        // a common vertex (not at common edges).
        this.#addLocalMaxPoly(ae1, ae2, pt);
        this.#addLocalMinPoly(ae1, ae2, pt);
      } else {
        // can't treat as maxima & minima
        this.#addOutPt(ae1, pt);
        this.#addOutPt(ae2, pt);
        swapOutrecs(ae1, ae2);
      }
    } // if one or other edge is 'hot' ...
    else if (isHotEdge(ae1)) {
      this.#addOutPt(ae1, pt);
      swapOutrecs(ae1, ae2);
    } else if (isHotEdge(ae2)) {
      this.#addOutPt(ae2, pt);
      swapOutrecs(ae1, ae2);
    }
    // neither edge is hot
    else {
      let e1Wc2;
      let e2Wc2;
      switch (this.#fillRule) {
        case FillRule.Positive:
          e1Wc2 = ae1.windCount2;
          e2Wc2 = ae2.windCount2;
          break;
        case FillRule.Negative:
          e1Wc2 = -ae1.windCount2;
          e2Wc2 = -ae2.windCount2;
          break;
        default:
          e1Wc2 = Math.abs(ae1.windCount2);
          e2Wc2 = Math.abs(ae2.windCount2);
          break;
      }

      if (ae1.localMin.polytype !== ae2.localMin.polytype) {
        this.#addLocalMinPoly(ae1, ae2, pt);
      } else if (oldE1WindCount === 1 && oldE2WindCount === 1) {
        switch (this.#clipType) {
          case ClipType.Union:
            if (e1Wc2 > 0 && e2Wc2 > 0) {
              return;
            }
            this.#addLocalMinPoly(ae1, ae2, pt);
            break;
          case ClipType.Difference:
            if (
              (ae1.localMin.polytype == PathType.Clip &&
                e1Wc2 > 0 &&
                e2Wc2 > 0) ||
              (ae1.localMin.polytype == PathType.Subject &&
                e1Wc2 <= 0 &&
                e2Wc2 <= 0)
            ) {
              this.#addLocalMinPoly(ae1, ae2, pt);
            }
            break;
          case ClipType.Xor:
            this.#addLocalMinPoly(ae1, ae2, pt);
            break;
          default: // ClipType.Intersection
            if (e1Wc2 <= 0 || e2Wc2 <= 0) {
              return;
            }
            this.#addLocalMinPoly(ae1, ae2, pt);
            break;
        }
      }
    }
  }

  #startOpenPath(ae: Active, pt: Point64) {
    const outrec = this.#newOutRec();
    outrec.isOpen = true;
    if (ae.windDx > 0) {
      outrec.frontEdge = ae;
      outrec.backEdge = undefined;
    } else {
      outrec.frontEdge = undefined;
      outrec.backEdge = ae;
    }
    ae.outrec = outrec;
    const op = new OutPt(pt, outrec);
    outrec.pts = op;
    return op;
  }

  #newOutRec() {
    const outrec: OutRec = {
      idx: this.#outrecList.length,
      outPtCount: 0,
      bounds: { topLeft: [0, 0] as Point64, bottomRight: [0, 0] as Point64 },
      path: [],
      isOpen: false,
      owner: undefined,
      frontEdge: undefined,
      backEdge: undefined,
      pts: undefined,
    };
    this.#outrecList.push(outrec);
    return outrec;
  }

  #swapPositionsInAEL(ae1: Active, ae2: Active) {
    // preconditon: ae1 must be immediately to the left of ae2
    const next = ae2.nextInAEL;
    if (next != null) {
      next.prevInAEL = ae1;
    }
    const prev = ae1.prevInAEL;
    if (prev != null) {
      prev.nextInAEL = ae2;
    }
    ae2.prevInAEL = prev;
    ae2.nextInAEL = ae1;
    ae1.prevInAEL = ae2;
    ae1.nextInAEL = next;
    if (ae2.prevInAEL == null) {
      this.#actives = ae2;
    }
  }

  #pushHorz(ae: Active) {
    ae.nextInSEL = this.#sel;
    this.#sel = ae;
  }

  #checkJoinRight(e: Active, pt: Point64, checkCurrX = false) {
    const next = e.nextInAEL;
    if (
      next == null ||
      !isHotEdge(e) ||
      !isHotEdge(next) ||
      isHorizontal(e) ||
      isHorizontal(next) ||
      isOpen(e) ||
      isOpen(next)
    ) {
      return;
    }
    // NOTE: We never store the +2 coordinate here, it is only computed temporarily for calculation purposes.
    // `Number.MAX_SAFE_INTEGER < Number.MAX_SAFE_INTEGER + 1` is `true` (and so is +2), so even if pt[1] and e.top[1] are MAX_SAFE_INTEGER,
    // the calculation will perform as expected and can exceed the SAFE_INTEGER range without limiting our x,y coordinate space.
    if (
      (pt[1] < e.top[1] + 2 || pt[1] < next.top[1] + 2) && // avoid trivial joins
      (e.bot[1] > pt[1] || next.bot[1] > pt[1]) // (#490)
    ) {
      return;
    }

    if (checkCurrX) {
      if (perpendicDistFromLineSqrd64(pt, next.bot, next.top) > 0.25) {
        return;
      }
    } else if (e.curX !== next.curX) {
      return;
    }
    if (!isCollinear(e.top, pt, next.top)) {
      return;
    }

    if (e.outrec!.idx === next.outrec!.idx) {
      this.#addLocalMaxPoly(e, next, pt);
    } else if (e.outrec!.idx < next.outrec!.idx) {
      this.#joinOutrecPaths(e, next);
    } else {
      this.#joinOutrecPaths(next, e);
    }
    e.joinWith = JoinWith.Right;
    next.joinWith = JoinWith.Left;
  }

  #insertScanline(y: number) {
    // using binary search, either find the y value already in our list
    // or insert it in its correct position
    let low = 0;
    let high = this.#scanlineList.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const midVal = this.#scanlineList[mid]!;
      if (midVal === y) {
        return; // already exists
      }
      if (midVal < y) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    this.#scanlineList.splice(low, 0, y);
  }

  #popHorz(): { result: true; ae: Active } | { result: false; ae: undefined } {
    const ae = this.#sel;
    if (this.#sel == null) {
      return { result: false, ae: undefined };
    }
    this.#sel = this.#sel.nextInSEL;
    return { result: true, ae: ae! };
  }

  #doHorizontal(horz: Active) {
    /********************************************************************************
     * Notes: Horizontal edges (HEs) at scanline intersections (i.e. at the top or  *
     * bottom of a scanbeam) are processed as if layered.The order in which HEs     *
     * are processed doesn't matter. HEs intersect with the bottom vertices of      *
     * other HEs[#] and with non-horizontal edges [*]. Once these intersections     *
     * are completed, intermediate HEs are 'promoted' to the next edge in their     *
     * bounds, and they in turn may be intersected[%] by other HEs.                 *
     *                                                                              *
     * eg: 3 horizontals at a scanline:    /   |                     /           /  *
     *              |                     /    |     (HE3)o ========%========== o   *
     *              o ======= o(HE2)     /     |         /         /                *
     *          o ============#=========*======*========#=========o (HE1)           *
     *         /              |        /       |       /                            *
     *******************************************************************************/

    const horzIsOpen = isOpen(horz);
    const Y = horz.bot[1];
    const vertex_max = horzIsOpen
      ? getCurrYMaximaVertex_Open(horz)
      : getCurrYMaximaVertex(horz);

    let { isLeftToRight, leftX, rightX } = resetHorzDirection(horz, vertex_max);

    if (isHotEdge(horz)) {
      const op = this.#addOutPt(horz, [horz.curX, Y] as Point64);
      this.#addToHorzSegList(op);
    }

    for (;;) {
      // loops through consec. horizontal edges (if open)
      let ae = isLeftToRight ? horz.nextInAEL : horz.prevInAEL;
      while (ae != null) {
        if (ae.vertexTop === vertex_max) {
          // do this first!!
          if (isHotEdge(horz) && isJoined(ae)) {
            this.#split(ae, ae.top);
          }

          if (isHotEdge(horz)) {
            while (horz.vertexTop !== vertex_max) {
              this.#addOutPt(horz, horz.top);
              this.#updateEdgeIntoAEL(horz);
            }
            if (isLeftToRight) {
              this.#addLocalMaxPoly(horz, ae, horz.top);
            } else {
              this.#addLocalMaxPoly(ae, horz, horz.top);
            }
          }

          this.#deleteFromAEL(ae);
          this.#deleteFromAEL(horz);
          return;
        }

        // if horzEdge is a maxima, keep going until we reach
        // its maxima pair, otherwise check for break conditions
        let pt: Point64;
        if (vertex_max !== horz.vertexTop || isOpenEndActive(horz)) {
          // otherwise stop when 'ae' is beyond the end of the horizontal line
          if (
            (isLeftToRight && ae.curX > rightX) ||
            (!isLeftToRight && ae.curX < leftX)
          ) {
            break;
          }

          if (ae.curX === horz.top[0] && !isHorizontal(ae)) {
            pt = nextVertex(horz).pt;
            // to maximize the possibility of putting open edges into
            // solutions, we'll only break if it's past HorzEdge's end
            if (
              isOpen(ae) &&
              ae.localMin.polytype !== horz.localMin.polytype &&
              !isHotEdge(ae)
            ) {
              if (
                (isLeftToRight && topX(ae, pt[1]) > pt[0]) ||
                (!isLeftToRight && topX(ae, pt[1]) < pt[0])
              ) {
                break;
              }
            }
            // otherwise for edges at horzEdge's end, only stop when horzEdge's
            // outslope is greater than e's slope when heading right or when
            // horzEdge's outslope is less than e's slope when heading left.
            else if (
              (isLeftToRight && topX(ae, pt[1]) >= pt[0]) ||
              (!isLeftToRight && topX(ae, pt[1]) <= pt[0])
            ) {
              break;
            }
          }
        }

        pt = [ae.curX, Y] as Point64;

        if (isLeftToRight) {
          this.#intersectEdges(horz, ae, pt);
          this.#swapPositionsInAEL(horz, ae);
          this.#checkJoinLeft(ae, pt);
          horz.curX = ae.curX;
          ae = horz.nextInAEL;
        } else {
          this.#intersectEdges(ae, horz, pt);
          this.#swapPositionsInAEL(ae, horz);
          this.#checkJoinRight(ae, pt);
          horz.curX = ae.curX;
          ae = horz.prevInAEL;
        }

        if (isHotEdge(horz)) {
          this.#addToHorzSegList(getLastOp(horz));
        }
      } // we've reached the end of this horizontal

      // check if we've finished looping
      // through consecutive horizontals
      if (horzIsOpen && isOpenEndActive(horz)) {
        // ie open at top
        if (isHotEdge(horz)) {
          this.#addOutPt(horz, horz.top);
          if (isFront(horz)) {
            horz.outrec!.frontEdge = undefined;
          } else {
            horz.outrec!.backEdge = undefined;
          }
          horz.outrec = undefined;
        }
        this.#deleteFromAEL(horz);
        return;
      }
      if (nextVertex(horz).pt[1] !== horz.top[1]) {
        break;
      }

      //still more horizontals in bound to process ...
      if (isHotEdge(horz)) {
        this.#addOutPt(horz, horz.top);
      }

      this.#updateEdgeIntoAEL(horz);

      ({ isLeftToRight, leftX, rightX } = resetHorzDirection(horz, vertex_max));
    } // end for loop and end of (possible consecutive) horizontals

    if (isHotEdge(horz)) {
      const op = this.#addOutPt(horz, horz.top);
      this.#addToHorzSegList(op);
    }

    this.#updateEdgeIntoAEL(horz); // this is the end of an intermediate horiz.
  }

  #addToHorzSegList(op: OutPt) {
    if (op.outrec.isOpen) {
      return;
    }
    this.#horzSegList.push(new HorzSegment(op));
  }

  #updateEdgeIntoAEL(ae: Active) {
    ae.bot = ae.top;
    ae.vertexTop = nextVertex(ae);
    ae.top = ae.vertexTop.pt;
    ae.curX = ae.bot[0];
    ae.dx = getDx(ae.bot, ae.top);

    if (isJoined(ae)) {
      this.#split(ae, ae.bot);
    }

    if (isHorizontal(ae)) {
      if (!isOpen(ae)) {
        trimHorz(ae, this.preserveCollinear);
      }
      return;
    }
    this.#insertScanline(ae.top[1]);

    this.#checkJoinLeft(ae, ae.bot);
    this.#checkJoinRight(ae, ae.bot, true); // (#500)
  }

  #deleteFromAEL(ae: Active) {
    const prev = ae.prevInAEL;
    const next = ae.nextInAEL;
    if (prev == null && next == null && ae !== this.#actives) {
      return; // already deleted
    }
    if (prev != null) {
      prev.nextInAEL = next;
    } else {
      this.#actives = next;
    }
    if (next != null) {
      next.prevInAEL = prev;
    }
  }

  #convertHorzSegsToJoins() {
    let k = 0;
    for (const hs of this.#horzSegList) {
      if (updateHorzSegment(hs)) {
        k++;
      }
    }
    if (k < 2) {
      return;
    }
    this.#horzSegList.sort(horzSegSort);
    for (let i = 0; i < k - 1; i++) {
      const hs1 = this.#horzSegList[i]!;
      // for each HorzSegment, find others that overlap
      for (let j = i; j < k; j++) {
        const hs2 = this.#horzSegList[j]!;
        if (
          hs2.leftOp!.pt[0] >= hs1.rightOp!.pt[0] ||
          hs2.leftToRight == hs1.leftToRight ||
          hs2.rightOp!.pt[0] <= hs1.leftOp!.pt[0]
        ) {
          continue;
        }
        const curr_y = hs1.leftOp!.pt[1];
        if (hs1.leftToRight) {
          while (
            hs1.leftOp!.next!.pt[1] === curr_y &&
            hs1.leftOp!.next!.pt[0] <= hs2.leftOp!.pt[0]
          ) {
            hs1.leftOp = hs1.leftOp!.next!;
          }
          while (
            hs2.leftOp!.prev.pt[1] === curr_y &&
            hs2.leftOp!.prev.pt[0] <= hs1.leftOp!.pt[0]
          ) {
            hs2.leftOp = hs2.leftOp!.prev;
          }
          this.#horzJoinList.push(
            new HorzJoin(
              this.#duplicateOp(hs1.leftOp!, true),
              this.#duplicateOp(hs2.leftOp!, false),
            ),
          );
        } else {
          while (
            hs1.leftOp!.prev.pt[1] === curr_y &&
            hs1.leftOp!.prev.pt[0] <= hs2.leftOp!.pt[0]
          ) {
            hs1.leftOp = hs1.leftOp!.prev;
          }
          while (
            hs2.leftOp!.next!.pt[1] == curr_y &&
            hs2.leftOp!.next!.pt[0] <= hs1.leftOp!.pt[0]
          ) {
            hs2.leftOp = hs2.leftOp!.next!;
          }
          this.#horzJoinList.push(
            new HorzJoin(
              this.#duplicateOp(hs2.leftOp!, true),
              this.#duplicateOp(hs1.leftOp!, false),
            ),
          );
        }
      }
    }
  }

  #duplicateOp(op: OutPt, insertAfter: boolean) {
    const result = new OutPt(op.pt, op.outrec);
    if (insertAfter) {
      result.next = op.next!;
      result.next.prev = result;
      result.prev = op;
      op.next = result;
    } else {
      result.prev = op.prev;
      result.prev.next = result;
      result.next = op;
      op.prev = result;
    }
    return result;
  }

  #doIntersections(topY: number) {
    if (!this.#buildIntersectList(topY)) {
      return;
    }
    this.#processIntersectList();
    this.#intersectList.length = 0;
  }

  #buildIntersectList(topY: number) {
    if (this.#actives?.nextInAEL == null) {
      return false;
    }

    // Calculate edge positions at the top of the current scanbeam, and from this
    // we will determine the intersections required to reach these new positions.
    this.#adjustCurrXAndCopyToSEL(topY);

    // Find all edge intersections in the current scanbeam using a stable merge
    // sort that ensures only adjacent edges are intersecting. Intersect info is
    // stored in FIntersectList ready to be processed in ProcessIntersectList.
    // Re merge sorts see https://stackoverflow.com/a/46319131/359538

    let left = this.#sel;

    while (left!.jump != null) {
      let prevBase: Active | undefined;
      while (left?.jump != null) {
        let currBase: Active | undefined = left;
        let right: Active | undefined = left.jump;
        let lEnd: Active | undefined = right;
        const rEnd: Active | undefined = right.jump;
        left.jump = rEnd;
        while (left !== lEnd && right !== rEnd) {
          if (right!.curX < left!.curX) {
            let tmp: Active | undefined = right!.prevInSEL;
            for (;;) {
              this.#addNewIntersectNode(tmp!, right!, topY);
              if (tmp === left) {
                break;
              }
              tmp = tmp!.prevInSEL!;
            }

            tmp = right;
            right = extractFromSEL(tmp!);
            lEnd = right;
            insert1Before2InSEL(tmp!, left!);
            if (left !== currBase) {
              continue;
            }
            currBase = tmp;
            currBase!.jump = rEnd;
            if (prevBase == null) {
              this.#sel = currBase;
            } else {
              prevBase.jump = currBase;
            }
          } else {
            left = left!.nextInSEL;
          }
        }

        prevBase = currBase;
        left = rEnd;
      }

      left = this.#sel;
    }

    return this.#intersectList.length > 0;
  }

  #adjustCurrXAndCopyToSEL(topY: number) {
    let ae = this.#actives;
    this.#sel = ae;
    while (ae != null) {
      ae.prevInSEL = ae.prevInAEL;
      ae.nextInSEL = ae.nextInAEL;
      ae.jump = ae.nextInSEL;
      // it is safe to ignore 'joined' edges here because
      // if necessary they will be split in IntersectEdges()
      ae.curX = topX(ae, topY);
      // NB don't update ae.curr.Y yet (see AddNewIntersectNode)
      ae = ae.nextInAEL;
    }
  }

  #addNewIntersectNode(ae1: Active, ae2: Active, topY: number) {
    // eslint-disable-next-line prefer-const
    let { nonParallel, ip } = getLineIntersectPt64(
      ae1.bot,
      ae1.top,
      ae2.bot,
      ae2.top,
    );
    if (!nonParallel) {
      ip = [ae1.curX, topY] as Point64;
    }

    if (ip[1] > this.#currentBotY || ip[1] < topY) {
      const absDx1 = Math.abs(ae1.dx);
      const absDx2 = Math.abs(ae2.dx);
      if (absDx1 > 100) {
        if (absDx2 > 100) {
          if (absDx1 > absDx2) {
            ip = getClosestPtOnSegment(ip, ae1.bot, ae1.top);
          } else {
            ip = getClosestPtOnSegment(ip, ae2.bot, ae2.top);
          }
        } else {
          ip = getClosestPtOnSegment(ip, ae1.bot, ae1.top);
        }
      } else {
        if (absDx2 > 100) {
          ip = getClosestPtOnSegment(ip, ae2.bot, ae2.top);
        } else {
          if (ip[1] < topY) {
            ip[1] = topY;
          } else {
            ip[1] = this.#currentBotY;
          }
          if (absDx1 < absDx2) {
            ip[0] = topX(ae1, ip[1]);
          } else {
            ip[0] = topX(ae2, ip[1]);
          }
        }
      }
    }

    const node = new IntersectNode(ip, ae1, ae2);
    this.#intersectList.push(node);
  }

  #processIntersectList() {
    // We now have a list of intersections required so that edges will be
    // correctly positioned at the top of the scanbeam. However, it's important
    // that edge intersections are processed from the bottom up, but it's also
    // crucial that intersections only occur between adjacent edges.

    // First we do a quicksort so intersections proceed in a bottom up order ...
    this.#intersectList.sort(intersectListSort);

    // Now as we process these intersections, we must sometimes adjust the order
    // to ensure that intersecting edges are always adjacent ...
    for (let i = 0; i < this.#intersectList.length; i++) {
      if (!edgesAdjacentInAEL(this.#intersectList[i]!)) {
        let j = i + 1;
        while (!edgesAdjacentInAEL(this.#intersectList[j]!)) {
          j++;
        }
        // swap
        const tmp = this.#intersectList[j]!;
        this.#intersectList[j] = this.#intersectList[i]!;
        this.#intersectList[i] = tmp;
      }

      const node = this.#intersectList[i]!;
      this.#intersectEdges(node.edge1, node.edge2, node.pt);
      this.#swapPositionsInAEL(node.edge1, node.edge2);

      node.edge1.curX = node.pt[0];
      node.edge2.curX = node.pt[0];
      this.#checkJoinLeft(node.edge2, node.pt, true);
      this.#checkJoinRight(node.edge1, node.pt, true);
    }
  }

  #doTopOfScanbeam(y: number) {
    this.#sel = undefined; // sel_ is reused to flag horizontals (see PushHorz below)
    let ae = this.#actives;
    while (ae != null) {
      // NB 'ae' will never be horizontal here
      if (ae.top[1] === y) {
        ae.curX = ae.top[0];
        if (isMaxima(ae.vertexTop!)) {
          ae = this.#doMaxima(ae); // TOP OF BOUND (MAXIMA)
          continue;
        }

        // INTERMEDIATE VERTEX ...
        if (isHotEdge(ae)) {
          this.#addOutPt(ae, ae.top);
        }
        this.#updateEdgeIntoAEL(ae);
        if (isHorizontal(ae)) {
          this.#pushHorz(ae); // horizontals are processed later
        }
      } // i.e. not the top of the edge
      else {
        ae.curX = topX(ae, y);
      }

      ae = ae.nextInAEL;
    }
  }

  #doMaxima(ae: Active) {
    const prevE = ae.prevInAEL;
    let nextE = ae.nextInAEL;

    if (isOpenEndActive(ae)) {
      if (isHotEdge(ae)) {
        this.#addOutPt(ae, ae.top);
      }
      if (isHorizontal(ae)) {
        return nextE;
      }
      if (isHotEdge(ae)) {
        if (isFront(ae)) {
          ae.outrec!.frontEdge = undefined;
        } else {
          ae.outrec!.backEdge = undefined;
        }
        ae.outrec = undefined;
      }
      this.#deleteFromAEL(ae);
      return nextE;
    }

    const maxPair = getMaximaPair(ae);
    if (maxPair == null) {
      return nextE; // eMaxPair is horizontal
    }

    if (isJoined(ae)) {
      this.#split(ae, ae.top);
    }
    if (isJoined(maxPair)) {
      this.#split(maxPair, maxPair.top);
    }

    // only non-horizontal maxima here.
    // process any edges between maxima pair ...
    while (nextE !== maxPair) {
      this.#intersectEdges(ae, nextE!, ae.top);
      this.#swapPositionsInAEL(ae, nextE!);
      nextE = ae.nextInAEL;
    }

    if (isOpen(ae)) {
      if (isHotEdge(ae)) {
        this.#addLocalMaxPoly(ae, maxPair, ae.top);
      }
      this.#deleteFromAEL(maxPair);
      this.#deleteFromAEL(ae);
      return prevE != null ? prevE.nextInAEL : this.#actives;
    }

    // here ae.nextInAel == ENext == EMaxPair ...
    if (isHotEdge(ae)) {
      this.#addLocalMaxPoly(ae, maxPair, ae.top);
    }

    this.#deleteFromAEL(ae);
    this.#deleteFromAEL(maxPair);
    return prevE != null ? prevE.nextInAEL : this.#actives;
  }

  #processHorzJoins() {
    for (const j of this.#horzJoinList) {
      const or1 = getRealOutRec(j.op1!.outrec)!;
      let or2 = getRealOutRec(j.op2!.outrec)!;

      const op1b = j.op1!.next!;
      const op2b = j.op2!.prev;
      j.op1!.next = j.op2!;
      j.op2!.prev = j.op1!;
      op1b.prev = op2b;
      op2b.next = op1b;

      if (or1 === or2) // 'join' is really a split
      {
        or2 = this.#newOutRec();
        or2.pts = op1b;
        fixOutRecPts(or2);

        //if or1->pts has moved to or2 then update or1->pts!!
        if (or1.pts!.outrec === or2) {
          or1.pts = j.op1!;
          or1.pts.outrec = or1;
        }

        or2.owner = or1;
      } else {
        or2.pts = undefined;
        or2.owner = or1;
      }
    }
  }

  #buildPaths(solutionClosed: Paths64, solutionOpen: Paths64) {
    solutionClosed.length = 0;
    solutionOpen.length = 0;

    let i = 0;
    // _outrecList.Count is not static here because
    // CleanCollinear can indirectly add additional OutRec
    while (i < this.#outrecList.length) {
      const outrec = this.#outrecList[i++]!;
      if (outrec.pts == null) {
        continue;
      }

      const path: Path64 = [];
      if (outrec.isOpen) {
        if (this.#buildPath(outrec.pts, this.reverseSolution, true, path))
          solutionOpen.push(path);
      } else {
        this.#cleanCollinear(outrec);
        // closed paths should always return a Positive orientation
        // except when ReverseSolution == true
        if (this.#buildPath(outrec.pts, this.reverseSolution, false, path))
          solutionClosed.push(path);
      }
    }

    return true;
  }

  #buildPath(
    op: OutPt | undefined,
    reverse: boolean,
    isOpen: boolean,
    path: Path64,
  ): boolean {
    if (op == null || op.next == op || (!isOpen && op.next == op.prev)) {
      return false;
    }

    path.length = 0;
    let lastPt: Point64;
    let op2: OutPt;

    if (reverse) {
      lastPt = op.pt;
      op2 = op.prev;
    } else {
      op = op.next!;
      lastPt = op.pt;
      op2 = op.next!;
    }
    path.push(lastPt);

    while (op2 !== op) {
      if (!pointEqual(op2.pt, lastPt)) {
        lastPt = op2.pt;
        path.push(lastPt);
      }
      if (reverse) {
        op2 = op2.prev;
      } else {
        op2 = op2.next!;
      }
    }

    return path.length !== 3 || isOpen || !isVerySmallTriangle(op2);
  }

  #cleanCollinear(outrec: OutRec | undefined) {
    outrec = getRealOutRec(outrec);

    if (outrec == null || outrec.isOpen) {
      return;
    }

    if (!isValidClosedPath(outrec.pts)) {
      outrec.pts = undefined;
      return;
    }

    let startOp = outrec.pts!;
    let op2: OutPt | undefined = startOp;

    for (;;) {
      // NB if preserveCollinear == true, then only remove 180 deg. spikes
      if (
        isCollinear(op2!.prev.pt, op2!.pt, op2!.next!.pt) &&
        (pointEqual(op2!.pt, op2!.prev.pt) ||
          pointEqual(op2!.pt, op2!.next!.pt) ||
          !this.preserveCollinear ||
          dotProduct64(op2!.prev.pt, op2!.pt, op2!.next!.pt) < 0)
      ) {
        if (op2 === outrec.pts) {
          outrec.pts = op2!.prev;
        }
        op2 = disposeOutPt(op2!);
        if (!isValidClosedPath(op2)) {
          outrec.pts = undefined;
          return;
        }
        startOp = op2!;
        continue;
      }
      op2 = op2!.next;
      if (op2 === startOp) {
        break;
      }
    }
    this.#fixSelfIntersects(outrec);
  }

  #fixSelfIntersects(outrec: OutRec) {
    let op2 = outrec.pts!;
    if (op2.prev === op2.next!.next) {
      return; // because triangles can't self-intersect
    }
    for (;;) {
      if (
        segsIntersect(op2.prev.pt, op2.pt, op2.next!.pt, op2.next!.next!.pt)
      ) {
        if (
          segsIntersect(
            op2.prev.pt,
            op2.pt,
            op2.next!.next!.pt,
            op2.next!.next!.next!.pt,
          )
        ) {
          // adjacent intersections (ie a micro self-intersection)
          op2 = this.#duplicateOp(op2, false);
          op2.pt = op2.next!.next!.next!.pt;
          op2 = op2.next!;
        } else {
          if (op2 === outrec.pts || op2.next === outrec.pts) {
            outrec.pts = outrec.pts!.prev;
          }
          this.#doSplitOp(outrec, op2);
          if (outrec.pts == null) {
            return;
          }
          op2 = outrec.pts;
          // triangles can't self-intersect
          if (op2.prev === op2.next!.next) {
            break;
          }
          continue;
        }
      }

      op2 = op2.next!;
      if (op2 === outrec.pts) {
        break;
      }
    }
  }

  #doSplitOp(outrec: OutRec, splitOp: OutPt) {
    // splitOp.prev <=> splitOp &&
    // splitOp.next <=> splitOp.next.next are intersecting

    const prevOp = splitOp.prev;
    const nextNextOp = splitOp.next!.next!;
    outrec.pts = prevOp;

    const { ip } = getLineIntersectPt64(
      prevOp.pt,
      splitOp.pt,
      splitOp.next!.pt,
      nextNextOp.pt,
    );

    const area1 = areaOutPt(prevOp);
    const absArea1 = Math.abs(area1);
    if (absArea1 < 2) {
      outrec.pts = undefined;
      return;
    }

    const area2 = areaTriangle(ip, splitOp.pt, splitOp.next!.pt);
    const absArea2 = Math.abs(area2);

    // de-link splitOp and splitOp.next from the path
    // while inserting the intersection point
    if (pointEqual(ip, prevOp.pt) || pointEqual(ip, nextNextOp.pt)) {
      nextNextOp.prev = prevOp;
      prevOp.next = nextNextOp;
    } else {
      const newOp2 = new OutPt(ip, outrec);
      newOp2.prev = prevOp;
      newOp2.next = nextNextOp;
      nextNextOp.prev = newOp2;
      prevOp.next = newOp2;
    }

    // nb: area1 is the path's area *before* splitting, whereas area2 is
    // the area of the triangle containing splitOp & splitOp.next.
    // So the only way for these areas to have the same sign is if
    // the split triangle is larger than the path containing prevOp or
    // if there's more than one self=intersection.
    if (
      !(absArea2 > 1) ||
      (!(absArea2 > absArea1) && area2 > 0 !== area1 > 0)
    ) {
      return;
    }

    const newOutRec = this.#newOutRec();
    newOutRec.owner = outrec.owner;
    splitOp.outrec = newOutRec;
    splitOp.next!.outrec = newOutRec;

    const newOp = new OutPt(ip, newOutRec);
    newOp.prev = splitOp.next!;
    newOp.next = splitOp;
    newOutRec.pts = newOp;
    splitOp.prev = newOp;
    splitOp.next!.next = newOp;
  }

  #clearSolutionOnly() {
    while (this.#actives != null) {
      this.#deleteFromAEL(this.#actives);
    }
    this.#scanlineList.length = 0;
    this.#intersectList.length = 0;
    this.#outrecList.length = 0;
    this.#horzSegList.length = 0;
    this.#horzJoinList.length = 0;
  }
}
