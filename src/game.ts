import Actor from './actor';
import Screen from './screen';
import Random from './random';

export default class Game {
  maxActorCount = 100;
  actors: Actor[] = [];
  codes: any = {};
  ticks = -1;
  score = 0;
  isValid = true;
  actorAddingCount = 0;
  random = new Random();

  constructor(public screen: Screen, public isKeyDown: boolean[]) {
  }

  addActor(name: string) {
    this.actorAddingCount++;
    if (this.actorAddingCount > 16) {
      this.isValid = false;
      return;
    }
    if (!this.codes.hasOwnProperty(name)) {
      //console.log(`Actor '${name}' is not defined`);
      return;
    }
    this.actors.push(new Actor(name, this.codes[name], this));
  }

  update() {
    this.ticks++;
    if (this.screen.hasDom && this.ticks % 10 > 0) {
      return;
    }
    if (this.screen != null) {
      this.screen.clear();
    }
    this.actorAddingCount = 0;
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
