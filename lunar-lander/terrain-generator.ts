import {Wall} from "./wall";
import {Graphics} from "./graphics";


export const sharpen = (graphics: Graphics, fuzzy: Wall[]): Wall[] => {
  const clearer: Wall[] = [];
  for (let i = 0; i < fuzzy.length; i++) {
    const wall = fuzzy[i];
    const walls = generate(graphics, wall);
    clearer.push(walls[0]);
    clearer.push(walls[1]);
  }
  return clearer;
}

export const generate = (graphics: Graphics, fuzzy: Wall): Wall[] => {
  const hw = fuzzy.w / 2;
  const hh = (fuzzy.h / 2) * (1 + (Math.random() - 0.5));
  return [
    new Wall(graphics).transform(fuzzy.x, fuzzy.y, hw, hh),
    new Wall(graphics).transform(fuzzy.x + hw, fuzzy.y + hh, fuzzy.w - hw, fuzzy.h - hh),
  ]
};
