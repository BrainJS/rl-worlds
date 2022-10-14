export class PuckWorld {
  ppx: number;
  ppy: number;
  pvx: number;
  pvy: number;
  tx: number;
  ty: number;
  tx2: number;
  ty2: number;
  rad: number;
  t: number;
  BADRAD: number;

  constructor() {
    this.ppx = Math.random(); // puck x,y
    this.ppy = Math.random();
    this.pvx = Math.random() * 0.05 -0.025; // velocity
    this.pvy = Math.random() * 0.05 -0.025;
    this.tx = Math.random(); // target
    this.ty = Math.random();
    this.tx2 = Math.random(); // target
    this.ty2 = Math.random(); // target
    this.rad = 0.05;
    this.t = 0;

    this.BADRAD = 0.25;
  }

  getState() {
    return [
      this.ppx - 0.5,
      this.ppy - 0.5,
      this.pvx * 10,
      this.pvy * 10,
      this.tx - this.ppx,
      this.ty - this.ppy,
      this.tx2 - this.ppx,
      this.ty2 - this.ppy
    ];
  }

  sampleNextState(a: number) {

    // world dynamics
    this.ppx += this.pvx; // newton
    this.ppy += this.pvy;
    this.pvx *= 0.95; // damping
    this.pvy *= 0.95;

    // agent action influences puck velocity
    const accel = 0.002;
    if (a === 0) this.pvx -= accel;
    if (a === 1) this.pvx += accel;
    if (a === 2) this.pvy -= accel;
    if (a === 3) this.pvy += accel;

    // handle boundary conditions and bounce
    if (this.ppx < this.rad) {
      this.pvx *= -0.5; // bounce!
      this.ppx = this.rad;
    }
    if (this.ppx > 1 - this.rad) {
      this.pvx *= -0.5;
      this.ppx = 1 - this.rad;
    }
    if (this.ppy < this.rad) {
      this.pvy *= -0.5; // bounce!
      this.ppy = this.rad;
    }
    if (this.ppy > 1 - this.rad) {
      this.pvy *= -0.5;
      this.ppy = 1 - this.rad;
    }

    this.t += 1;
    if (this.t % 100 === 0) {
      this.tx = Math.random(); // reset the target location
      this.ty = Math.random();
    }

    // if(this.t % 73 === 0) {
    //   this.tx2 = Math.random(); // reset the target location
    //   this.ty2 = Math.random();
    // }

    // compute distances
    const dx1 = this.ppx - this.tx;
    const dy1 = this.ppy - this.ty;
    const d1 = Math.sqrt(dx1*dx1+dy1*dy1);

    const dx2 = this.ppx - this.tx2;
    const dy2 = this.ppy - this.ty2;
    const d2 = Math.sqrt(dx2*dx2+dy2*dy2);

    const dxnorm = dx2 / d2;
    const dynorm = dy2 / d2;
    let speed = 0.001;
    this.tx2 += speed * dxnorm;
    this.ty2 += speed * dynorm;

    // compute reward
    let r = -d1; // want to go close to green
    if (d2 < this.BADRAD) {
      // but if we're too close to red that's bad
      r += 2 * (d2 - this.BADRAD) / this.BADRAD;
    }

    //if(a === 4) r += 0.05; // give bonus for gliding with no force

    // evolve state in time
    const ns = this.getState();
    return {
      ns,
      r
    };
  }
}
