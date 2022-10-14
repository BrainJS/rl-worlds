// Wall is made up of two points
import {Vec} from "./vec";

export class Wall {
  p1: Vec;
  p2: Vec;
  constructor(p1: Vec, p2: Vec) {
    this.p1 = p1;
    this.p2 = p2;
  }
}
