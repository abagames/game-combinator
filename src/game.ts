import Actor from './actor';
import Screen from './screen';

export default class Game {
  actors: Actor[] = [];
  codes: any = {};
  ticks = -1;
  score = 0;

  constructor(public screen: Screen, public isKeyDown: boolean[]) {
  }

  addActor(name: string) {
    if (!this.codes.hasOwnProperty(name)) {
      console.error(`Actor '${name}' is not defined`);
      return;
    }
    this.actors.push(new Actor(name, this.codes[name], this));
  }

  update() {
    this.ticks++;
    if (this.ticks % 10 > 0) {
      return;
    }
    this.screen.clear();
    for (let i = 0; i < this.actors.length;) {
      const a = this.actors[i];
      if (a.isAlive) {
        a.update();
      }
      if (a.isAlive) {
        i++;
      } else {
        this.actors.splice(i, 1);
      }
    }
  }

  end() {
    this.actors = [];
  }

  addScore(score = 1) {
    this.score += score;
  }
}
