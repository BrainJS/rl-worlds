// return Mat but filled with random numbers from gaussian
import { Mat } from "./mat";
import { fillRandn } from "./utilities";

export class RandMat extends Mat {
  constructor(n: number, d: number, mu: number, std: number) {
    super(n, d);
    fillRandn(this, mu, std);
    //fillRand(this,-std,std); // kind of :P
  }
}
