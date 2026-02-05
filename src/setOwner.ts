import type { OutRec } from "./OutRec.ts";

export function setOwner(outrec: OutRec, newOwner: OutRec) {
  //precondition1: new_owner is never null
  while (newOwner.owner != null && newOwner.owner.pts == null) {
    newOwner.owner = newOwner.owner.owner;
  }

  //make sure that outrec isn't an owner of newOwner
  let tmp: OutRec | undefined = newOwner;
  while (tmp != null && tmp !== outrec) {
    tmp = tmp.owner;
  }
  if (tmp != null) {
    newOwner.owner = outrec.owner;
  }
  outrec.owner = newOwner;
}
