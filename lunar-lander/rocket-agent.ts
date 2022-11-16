// A single agent
import {Vec} from "../waterworld/vec";
import {DQNAgent, IDQNAgentOptions, Mat, RandMat} from "@brainjs/rl";

export interface IRocketAgentOptions extends IDQNAgentOptions {
  onInput: () => number[];
  onAction: (action: number) => void;
  onReward: () => number;
}

export class RocketAgent extends DQNAgent {
  v: Vec = new Vec(0, 0);
  action: number = 0;
  lastReward: number = 0;
  constructor(private opt: IRocketAgentOptions) {
    super(opt);
  }
  // @ts-ignore
  // act(slist: number[] | Float64Array): Float64Array {
  //   // convert to a Mat column vector
  //   const s = new Mat(this.inputSize, 1);
  //   s.setFrom(slist);
  //
  //   let action: Mat;
  //   // epsilon greedy policy
  //   if (Math.random() < this.epsilon) {
  //     action = new RandMat(this.outputSize, 1, 0, 0.01);
  //   } else {
  //     // greedy wrt Q function
  //     action = this.forwardQ(s, true);
  //   }
  //
  //   // shift state memory
  //   this.s0 = this.s1;
  //   this.a0 = this.a1;
  //   this.s1 = s;
  //   this.a1 = action.maxi();
  //
  //   return action.w;
  // }
  forward(): void {
    // in forward pass the agent simply behaves in the environment
    // create input to brain
    this.action = this.act(this.opt.onInput());
    this.opt.onAction(this.action);
    //var action = this.actions[actionix];
    // demultiplex into behavior variables
    //this.action = action;
  }
  backward(): void {
    const reward = this.opt.onReward();

    // var proximity_reward = 0.0;
    // var num_eyes = this.eyes.length;
    // for(var i=0;i<num_eyes;i++) {
    //   var e = this.eyes[i];
    //   // agents dont like to see walls, especially up close
    //   proximity_reward += e.sensed_type === 0 ? e.sensed_proximity/e.max_range : 1.0;
    // }
    // proximity_reward = proximity_reward/num_eyes;
    // reward += proximity_reward;

    //var forward_reward = 0.0;
    //if(this.actionix === 0) forward_reward = 1;

    this.lastReward = reward; // for vis
    this.learn(reward);
  }
}
