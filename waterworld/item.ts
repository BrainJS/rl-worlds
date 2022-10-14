import { Vec } from "./vec";

// item is circle thing on the floor that agent can interact with (see or eat, etc)
export class Item {
  p: Vec;
  v: Vec;
  type: number;
  rad: number;
  age: number;
  cleanup_: boolean;

  constructor(x: number, y: number, type: number) {
    this.p = new Vec(x, y); // position
    this.v = new Vec(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
    this.type = type;
    this.rad = 10; // default radius
    this.age = 0;
    this.cleanup_ = false;
  }
}
