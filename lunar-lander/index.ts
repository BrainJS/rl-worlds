import {RocketWorld} from "./rocket-world";
import {Ship} from "./ship";
import {Graphics} from "./graphics";
import {Booster} from "./booster";
import {Controller} from "./controller";
import {FuelGauge} from "./fuel-gauge";
import {Explosion} from "./explosion";
import {Wall} from "./wall";
import {ShipWallCollider} from "./ship-wall-collider";
import {Stars} from "./stars";
import {Pad} from "./pad";
import {IRocketAgentOptions, RocketAgent} from "./rocket-agent";
import {IDQNAgentJSON} from "@brainjs/rl";

const size = 600;
const restartTime = 1000;
const canvas = document.createElement("canvas");
canvas.width = size;
canvas.height = size;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
if (ctx === null) throw new Error("Cannot get context from canvas");
const graphics = new Graphics(canvas, ctx);
let rocketAgentJson: IDQNAgentJSON | null = null;
function reset() {
  const countElement = document.getElementById("count");
  if (!countElement) throw new Error("no count element");
  countElement.innerHTML = (parseInt(countElement.innerHTML) + 1).toString();
  const controller = new Controller();
  // const keysDown: boolean[] = [];
  // document.body.onkeydown = (e) => {
  //   keysDown.push(true);
  //   let returnValue;
  //   if (e.key === "ArrowUp") {
  //     controller.mainBoosting = true;
  //     returnValue = false;
  //   }
  //   if (e.key === "ArrowLeft") {
  //     controller.rightBoosting = true;
  //     returnValue = false;
  //   }
  //   if (e.key === "ArrowRight") {
  //     controller.leftBoosting = true;
  //     returnValue = false;
  //   }
  //   return returnValue;
  // };
  // document.body.onkeyup = (e) => {
  //   keysDown.pop();
  //   let returnValue;
  //   if (e.key === "ArrowUp") {
  //     controller.mainBoosting = false;
  //     returnValue = false;
  //   }
  //   if (e.key === "ArrowLeft") {
  //     controller.rightBoosting = false;
  //     returnValue = false;
  //   }
  //   if (e.key === "ArrowRight") {
  //     controller.leftBoosting = false;
  //     returnValue = false;
  //   }
  //   return returnValue;
  // };
  const mainBooster = new Booster("main", 0, graphics, controller, () => ship, () => controller.mainBoosting)
    .transform(0, -0.023, 0.025, 0.035);
  const leftBooster = new Booster("left", -Math.PI / 2, graphics, controller, () => ship, () => controller.leftBoosting)
    .transform(-0.025, 0.003, 0.015, 0.02);
  const rightBooster = new Booster("right", Math.PI / 2, graphics, controller, () => ship, () => controller.rightBoosting)
    .transform(0.025, 0.003, 0.015, 0.02);
  const boosters: Booster[] = [mainBooster, leftBooster, rightBooster];
  const fuelGauge = new FuelGauge(graphics, () => ship)
    .transform(0.02, 0.94, 0.2, 0.04);
  const explosion = new Explosion(graphics);
  const ship = new Ship(
    graphics,
    explosion,
    boosters
  ).transform(0.5, 0.9, 0.05, 0.07);
  const walls = Wall.generate(size, size, graphics);
  const pad = new Pad(graphics, walls);
  const shipWallCollider = new ShipWallCollider(walls, pad, ship, () => {
    ship.collision = true;
    explosion.exploded = true;
    rocketAgentJson = rocketAgent.toJSON();
    setTimeout(() => {
      rocketWorld.cancel();
      reset();
    }, restartTime);
  }, () => {
    rocketAgentJson = rocketAgent.toJSON();
    setTimeout(() => {
      rocketWorld.cancel();
      reset();
    }, restartTime);
  });
  let crashed = false;
  const stars = new Stars(100, graphics, walls);
  const rocketWorld = new RocketWorld(size, graphics, [
    stars,
    shipWallCollider,
    mainBooster,
    rightBooster,
    leftBooster,
    fuelGauge,
    explosion,
    ship,
    ...walls,
    pad,
  ], () => {
    if (crashed) return;
    rocketAgent.forward();
    rocketAgent.backward();
  });

  function sense() {
    const wallDistance = shipWallCollider.wallDistance();
    const padDistance = shipWallCollider.padDistance();
    const dx = Math.abs(ship.x - pad.x);
    const dy = Math.abs(ship.y - ship.h / 2 - pad.y);
    const v = Math.sqrt(
      ship.vx ** 2 + ship.vy ** 2
    )
    return [
      v,
      wallDistance,
      padDistance.x,
      padDistance.y,
      fuelGauge.remainingFuel(),
      ship.grounded ? 1 : 0,
      ship.collision ? 1 : 0,
      ship.x,
      ship.y,
      ship.vx,
      ship.vy,
      ship.ax,
      ship.ay,
      pad.x,
      pad.y,
      dx,
      dy,
      ((pad.x - ship.x) ** 2) + ((pad.y - ship.y) ** 2),
      // ...walls.map((wall) => [wall.x, wall.y]).flat(),
    ]
  }

  let lastWallDistance = shipWallCollider.wallDistance();
  let lastPadDistance = shipWallCollider.padDistance();
  let mainThrottle = 0;
  let leftThrottle = 0;
  let rightThrottle = 0;
  const rocketAgentOptions: IRocketAgentOptions = {
    alpha: 0.00001,
    gamma: 0.99,
    epsilon: 0.99,
    experienceAddEvery: 40,
    experienceSize: 500000,
    learningStepsPerIteration: 2,
    // activation: "relu",
    // tderrorClamp: 1,
    hiddenLayers: [256],
    // experienceAddEvery: 1000,
    // experienceSize: 50000,
    inputSize: sense().length,
    outputSize: 6,
    onAction: (action) => {
      if (action === 0) {
        controller.mainBoosting = false;
      } else if (action === 1) {
        controller.mainBoosting = true;
      } else if (action === 2) {
        controller.leftBoosting = false;
      } else if (action === 3) {
        controller.leftBoosting = true;
      } else if (action === 4) {
        controller.rightBoosting = false;
      } else if (action === 5) {
        controller.rightBoosting = true;
      }
    },
    onReward: () => {
      let reward = 0;
      const padDistance = shipWallCollider.padDistance();
      const distance = Math.abs(padDistance.x) + Math.abs(padDistance.y);
      if (distance < 0.15) {
        reward -= 1 - fuelGauge.remainingFuel();
        if (
          Math.abs(lastPadDistance.x) > Math.abs(padDistance.x)) {
          reward += .5 - Math.abs(padDistance.x);
        }
        if (Math.abs(lastPadDistance.y) > Math.abs(padDistance.y)) {
          reward += .5 - Math.abs(padDistance.y);
        }
      }
      // reward -= Math.abs(ship.vx) + Math.abs(ship.vy);
      if (ship.collision) {
        crashed = true;
        reward = -100 * distance;
      } else if (ship.grounded) {
        reward += 100;
      }
      if (fuelGauge.remainingFuel() === 0) {
        reward -= 20;
      }
      lastPadDistance = padDistance;
      console.log(reward);
      return reward;
    },
    onInput: () => sense(),
  };
  const rocketAgent = rocketAgentJson ? new RocketAgent({...rocketAgentOptions, ...rocketAgentJson}) : new RocketAgent(rocketAgentOptions);
}
reset();
