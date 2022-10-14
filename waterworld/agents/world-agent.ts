// A single agent
import { Vec } from "../vec";
import { Eye } from "../eye";
import {DQNAgent, IDQNAgentOptions} from "../../lib/agents/dqn-agent";

export interface IWorldAgentOptions extends IDQNAgentOptions {
  eyes: number;
}

export class WorldAgent extends DQNAgent {
  p: Vec = new Vec(300, 300); // positional information
  v: Vec = new Vec(0, 0);
  op: Vec = new Vec(300, 300);
  angle: number = 0; // direction facing
  oangle: number = 0;
  actions: [0,1,2,3] = [0,1,2,3];
  rad: number = 10;
  eyes: Eye[] = [];
  reward_bonus: number = 0;
  digestion_signal: number = 0;
  apples: number = 0;
  poison: number = 0;
  action: number = 0; // outputs on world
  prevactionix: number = -1;
  last_reward: number = 0;
  constructor(opt: IWorldAgentOptions) {
    super({
      ...opt,
      numStates: opt.eyes,
      maxNumActions: opt.eyes * 5 + 2,
    });
    // properties
    for (let k = 0; k < 30; k++) {
      this.eyes.push(new Eye(k * 0.21));
    }
  }
  forward(): void {
    // in forward pass the agent simply behaves in the environment
    // create input to brain
    const num_eyes = this.eyes.length;
    const ne = num_eyes * 5;
    const input_array: number[] = new Array(this.maxNumActions);
    for (let i = 0; i < num_eyes; i++) {
      const e = this.eyes[i];
      input_array[i * 5] = 1;
      input_array[i * 5 + 1] = 1;
      input_array[i * 5 + 2] = 1;
      input_array[i * 5 + 3] = e.vx; // velocity information of the sensed target
      input_array[i * 5 + 4] = e.vy;
      if (e.sensed_type !== -1) {
        // sensed_type is 0 for wall, 1 for food and 2 for poison.
        // lets do a 1-of-k encoding into the input array
        input_array[i * 5 + e.sensed_type] = e.sensed_proximity / e.max_range; // normalize to [0,1]
      }
    }
    // proprioception and orientation
    input_array[ne + 0] = this.v.x;
    input_array[ne + 1] = this.v.y;

    this.action = this.act(input_array);
    //var action = this.actions[actionix];
    // demultiplex into behavior variables
    //this.action = action;
  }
  backward(): void {
    const reward = this.digestion_signal;

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

    this.last_reward = reward; // for vis
    this.learn(reward);
  }
}
