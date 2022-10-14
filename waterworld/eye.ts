// Eye sensor has a maximum range and senses walls
export class Eye {
  angle: number;
  max_range: number;
  sensed_proximity: number;
  sensed_type: number;
  vx: number;
  vy: number;

  constructor(angle: number) {
    this.angle = angle; // angle relative to agent its on
    this.max_range = 120;
    this.sensed_proximity = 120; // what the eye is seeing. will be set in world.tick()
    this.sensed_type = -1; // what does the eye see?
    this.vx = 0; // sensed velocity
    this.vy = 0;
  }
}
