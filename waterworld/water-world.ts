import { Item } from "./item";
import { Vec } from "./vec";
import { Wall } from "./wall";
import { WorldAgent } from "./agents/world-agent";

export class WaterWorld {
  agents: WorldAgent[] = [];
  walls: Wall[];
  W: number;
  H: number;
  clock: number;
  items: Item[];
  collpoints: [];

  constructor(canvas: HTMLCanvasElement) {
    this.W = canvas.width;
    this.H = canvas.height;

    this.clock = 0;

    // set up walls in the world
    this.walls = [];
    const pad = 0;
    util_add_box(this.walls, pad, pad, this.W - pad * 2, this.H - pad * 2);
    /*
    util_add_box(this.walls, 100, 100, 200, 300); // inner walls
    this.walls.pop();
    util_add_box(this.walls, 400, 100, 200, 300);
    this.walls.pop();
    */

    // set up food and poison
    this.items = []
    for (let k = 0; k < 50; k++) {
      const x = randf(20, this.W - 20);
      const y = randf(20, this.H - 20);
      const t = randi(1, 3); // food or poison (1 and 2)
      const it = new Item(x, y, t);
      this.items.push(it);
    }
    this.collpoints = [];
  }

  addAgent(a: WorldAgent): void {
    this.agents.push(a);
  }

  // helper function to get closest colliding walls/items
  stuff_collide_(p1: Vec, p2: Vec, check_walls: boolean, check_items: boolean): false | IIntersect {
    let minres: false | IIntersect = false;

    // collide with walls
    if(check_walls) {
      for(let i=0,n=this.walls.length;i<n;i++) {
        const wall = this.walls[i];
        const res = line_intersect(p1, p2, wall.p1, wall.p2);
        if(res) {
          res.type = 0; // 0 is wall
          if(!minres) { minres=res; }
          else {
            // check if its closer
            if(res.ua < minres.ua) {
              // if yes replace it
              minres = res;
            }
          }
        }
      }
    }

    // collide with items
    if (check_items) {
      for(let i=0,n=this.items.length;i<n;i++) {
        const it = this.items[i];
        const res = line_point_intersect(p1, p2, it.p, it.rad);
        if(res) {
          res.type = it.type; // store type of item
          res.vx = it.v.x; // velocty information
          res.vy = it.v.y;
          if(!minres) { minres=res; }
          else { if(res.ua < minres.ua) { minres = res; }
          }
        }
      }
    }

    return minres;
  }

  tick() {
    // tick the environment
    this.clock++;

    // fix input to all agents based on environment
    // process eyes
    this.collpoints = [];
    for(let i=0,n=this.agents.length;i<n;i++) {
      const a = this.agents[i];
      for(let ei=0,ne=a.eyes.length;ei<ne;ei++) {
        const e = a.eyes[ei];
        // we have a line from p to p->eyep
        const eyep = new Vec(a.p.x + e.max_range * Math.sin(a.angle + e.angle),
          a.p.y + e.max_range * Math.cos(a.angle + e.angle));
        const res = this.stuff_collide_(a.p, eyep, true, true);
        if (res && typeof res.type !== 'undefined') {
          // eye collided with wall
          e.sensed_proximity = res.up.dist_from(a.p);
          e.sensed_type = res.type;
          if('vx' in res && typeof res.vx === 'number' && typeof res.vy === 'number') {
            e.vx = res.vx;
            e.vy = res.vy;
          } else {
            e.vx = 0;
            e.vy = 0;
          }
        } else {
          e.sensed_proximity = e.max_range;
          e.sensed_type = -1;
          e.vx = 0;
          e.vy = 0;
        }
      }
    }

    // let the agents behave in the world based on their input
    for(let i=0,n=this.agents.length;i<n;i++) {
      this.agents[i].forward();
    }

    // apply outputs of agents on evironment
    for(let i=0,n=this.agents.length;i<n;i++) {
      const a = this.agents[i];
      a.op = a.p; // back up old position
      a.oangle = a.angle; // and angle

      // execute agent's desired action
      var speed = 1;
      if(a.action === 0) {
        a.v.x += -speed;
      }
      if(a.action === 1) {
        a.v.x += speed;
      }
      if(a.action === 2) {
        a.v.y += -speed;
      }
      if(a.action === 3) {
        a.v.y += speed;
      }

      // forward the agent by velocity
      a.v.x *= 0.95; a.v.y *= 0.95;
      a.p.x += a.v.x; a.p.y += a.v.y;

      // agent is trying to move from p to op. Check walls
      //var res = this.stuff_collide_(a.op, a.p, true, false);
      //if(res) {
      // wall collision...
      //}

      // handle boundary conditions.. bounce agent
      if(a.p.x<1) { a.p.x=1; a.v.x=0; a.v.y=0;}
      if(a.p.x>this.W-1) { a.p.x=this.W-1; a.v.x=0; a.v.y=0;}
      if(a.p.y<1) { a.p.y=1; a.v.x=0; a.v.y=0;}
      if(a.p.y>this.H-1) { a.p.y=this.H-1; a.v.x=0; a.v.y=0;}

      // if(a.p.x<0) { a.p.x= this.W -1; };
      // if(a.p.x>this.W) { a.p.x= 1; }
      // if(a.p.y<0) { a.p.y= this.H -1; };
      // if(a.p.y>this.H) { a.p.y= 1; };
    }

    // tick all items
    let update_items = false;
    for(let j=0,m=this.agents.length;j<m;j++) {
      const a = this.agents[j];
      a.digestion_signal = 0; // important - reset this!
    }
    for(let i=0,n=this.items.length;i<n;i++) {
      let it = this.items[i];
      it.age += 1;

      // see if some agent gets lunch
      for(let j=0,m=this.agents.length;j<m;j++) {
        const a = this.agents[j];
        const d = a.p.dist_from(it.p);
        if(d < it.rad + a.rad) {

          // wait lets just make sure that this isn't through a wall
          //var rescheck = this.stuff_collide_(a.p, it.p, true, false);
          let rescheck = false;
          if(!rescheck) {
            // ding! nom nom nom
            if(it.type === 1) {
              a.digestion_signal += 1.0; // mmm delicious apple
              a.apples++;
            }
            if(it.type === 2) {
              a.digestion_signal += -1.0; // ewww poison
              a.poison++;
            }
            it.cleanup_ = true;
            update_items = true;
            break; // break out of loop, item was consumed
          }
        }
      }

      // move the items
      it.p.x += it.v.x;
      it.p.y += it.v.y;
      if(it.p.x < 1) { it.p.x = 1; it.v.x *= -1; }
      if(it.p.x > this.W-1) { it.p.x = this.W-1; it.v.x *= -1; }
      if(it.p.y < 1) { it.p.y = 1; it.v.y *= -1; }
      if(it.p.y > this.H-1) { it.p.y = this.H-1; it.v.y *= -1; }

      if(it.age > 5000 && this.clock % 100 === 0 && randf(0,1)<0.1) {
        it.cleanup_ = true; // replace this one, has been around too long
        update_items = true;
      }

    }
    if(update_items) {
      const nt = [];
      for(let i=0,n=this.items.length;i<n;i++) {
        const it = this.items[i];
        if(!it.cleanup_) nt.push(it);
      }
      this.items = nt; // swap
    }
    if (this.items.length < 50 && this.clock % 10 === 0 && randf(0,1)<0.25) {
      const newitx = randf(20, this.W-20);
      const newity = randf(20, this.H-20);
      const newitt = randi(1, 3); // food or poison (1 and 2)
      const newit = new Item(newitx, newity, newitt);
      this.items.push(newit);
    }

    // agents are given the opportunity to learn based on feedback of their action on environment
    for (let i = 0, n=this.agents.length; i < n; i++) {
      this.agents[i].backward();
    }
  }
}

function randf(lo: number, hi: number): number {
  return Math.random() * (hi-lo) + lo;
}
function randi(lo: number, hi: number): number {
  return Math.floor(randf(lo,hi));
}

export interface IIntersect {
  ua: number;
  ub?: number;
  up: Vec;
  type?: number;
  vx?: number;
  vy?: number;
}

// line intersection helper function: does line segment (p1,p2) intersect segment (p3,p4) ?
function line_intersect(p1: Vec,p2: Vec,p3: Vec,p4: Vec): IIntersect | false {
  const denom = (p4.y-p3.y)*(p2.x-p1.x)-(p4.x-p3.x)*(p2.y-p1.y);
  if(denom===0.0) { return false; } // parallel lines
  const ua = ((p4.x-p3.x)*(p1.y-p3.y)-(p4.y-p3.y)*(p1.x-p3.x))/denom;
  const ub = ((p2.x-p1.x)*(p1.y-p3.y)-(p2.y-p1.y)*(p1.x-p3.x))/denom;
  if(ua>0.0&&ua<1.0&&ub>0.0&&ub<1.0) {
    const up = new Vec(p1.x+ua*(p2.x-p1.x), p1.y+ua*(p2.y-p1.y));
    return {ua:ua, ub:ub, up:up}; // up is intersection point
  }
  return false;
}

function line_point_intersect(p1: Vec,p2: Vec,p0: Vec,rad: number): IIntersect | false {
  const v = new Vec(p2.y-p1.y,-(p2.x-p1.x)); // perpendicular vector
  let d = Math.abs((p2.x-p1.x)*(p1.y-p0.y)-(p1.x-p0.x)*(p2.y-p1.y));
  d = d / v.length();
  if(d > rad) { return false; }

  v.normalize();
  v.scale(d);
  const up = p0.add(v);
  let ua: number;
  if(Math.abs(p2.x-p1.x)>Math.abs(p2.y-p1.y)) {
    ua = (up.x - p1.x) / (p2.x - p1.x);
  } else {
    ua = (up.y - p1.y) / (p2.y - p1.y);
  }
  if(ua>0.0&&ua<1.0) {
    return {ua:ua, up:up};
  }
  return false;
}

// World object contains many agents and walls and food and stuff
function util_add_box(lst: Wall[], x: number, y: number, w: number, h: number): void {
  lst.push(new Wall(new Vec(x,y), new Vec(x+w,y)));
  lst.push(new Wall(new Vec(x+w,y), new Vec(x+w,y+h)));
  lst.push(new Wall(new Vec(x+w,y+h), new Vec(x,y+h)));
  lst.push(new Wall(new Vec(x,y+h), new Vec(x,y)));
}
