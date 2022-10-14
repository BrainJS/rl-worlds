import { DPAgent, IDPAgentOptions } from "@brainjs/rl";

export interface IWorldAgentOpt {
  gh: number;
  gw: number;
  gs: number;
}

export interface IWorldAgentState {
  ns: number;
  r: number;
  reset_episode?: boolean;
}

export class WorldAgent extends DPAgent {
  Rarr: Float64Array | number[]; // reward array
  T: Float64Array | number[]; // cell types, 0 = normal, 1 = cliff;
  gh: number;
  gw: number;
  gs: number;

  constructor(opt: IWorldAgentOpt & IDPAgentOptions) {
    super(opt);
    // hardcoding one gridworld for now
    this.gh = opt.gh;
    this.gw = opt.gw;
    this.gs = opt.gs;

    // specify some rewards
    const Rarr = this.Rarr = new Float64Array(this.gs);
    const T = this.T = new Float64Array(this.gs);
    Rarr[55] = 1;

    Rarr[54] = -1;
    //Rarr[63] = -1;
    Rarr[64] = -1;
    Rarr[65] = -1;
    Rarr[85] = -1;
    Rarr[86] = -1;

    Rarr[37] = -1;
    Rarr[33] = -1;
    //Rarr[77] = -1;
    Rarr[67] = -1;
    Rarr[57] = -1;

    // make some cliffs
    for(let q = 0; q < 8; q++) { let off = (q+1)*this.gh+2; T[off] = 1; Rarr[off] = 0; }
    for(let q = 0; q < 6; q++) { let off = 4*this.gh+q+2; T[off] = 1; Rarr[off] = 0; }
    T[5*this.gh+2] = 0; Rarr[5*this.gh+2] = 0; // make a hole
  }
  reward(s: number, a?: number, ns?: number): number {
    // reward of being in s, taking action a, and ending up in ns
    return this.Rarr[s];
  }
  nextStateDistribution(s: number, a: number): number {
    let ns: number = 0;
    // given (s,a) return distribution over s' (in sparse form)
    if (this.T[s] === 1) {
      // cliff! oh no!
      // var ns = 0; // reset to state zero (start)
    } else if (s === 55) {
      // agent wins! teleport to start
      ns = this.startState();
      while (this.T[ns] === 1) {
        ns = this.randomState();
      }
    } else {
      // ordinary space
      let nx = 0;
      let ny = 0;
      const x = this.stox(s);
      const y = this.stoy(s);
      if (a === 0) { nx=x-1; ny=y; }
      if (a === 1) { nx=x; ny=y-1; }
      if (a === 2) { nx=x; ny=y+1; }
      if (a === 3) { nx=x+1; ny=y; }
      ns = nx * this.gh + ny;
      if (this.T[ns] === 1) {
        // actually never mind, this is a wall. reset the agent
        ns = s;
      }
    }
    // gridworld is deterministic, so return only a single next state
    return ns;
  }
  sampleNextState(s: number, a: number): IWorldAgentState {
    // gridworld is deterministic, so this is easy
    const ns = this.nextStateDistribution(s,a);
    let r = this.Rarr[s]; // observe the raw reward of being in s, taking a, and ending up in ns
    r -= 0.01; // every step takes a bit of negative reward
    const out: IWorldAgentState = { ns, r };
    if(s === 55 && ns === 0) {
      // episode is over
      out.reset_episode = true;
    }
    return out;
  }
  allowedActions(s: number): number[] {
    const x = this.stox(s);
    const y = this.stoy(s);
    const as = [];
    if (x > 0) { as.push(0); }
    if (y > 0) { as.push(1); }
    if (y < this.gh-1) { as.push(2); }
    if (x < this.gw-1) { as.push(3); }
    return as;
  }
  randomState() { return Math.floor(Math.random()*this.gs); }
  startState() { return 0; }

  // private functions
  stox(s: number): number { return Math.floor(s/this.gh); }
  stoy(s: number): number { return s % this.gh; }
  xytos(x: number, y: number): number { return x*this.gh + y; }
}
