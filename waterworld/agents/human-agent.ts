import { IWorldAgentOptions, WorldAgent } from "./world-agent";

export class HumanAgent extends WorldAgent {
  humanAction: number;

  constructor(opt: IWorldAgentOptions) {
    super(opt);
    this.humanAction = -1;
  }

  forward() {
    this.action = this.humanAction;
    this.humanAction = -1;
  }

  learn(reward: number): void {}
}
