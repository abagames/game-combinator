import * as _ from 'lodash';
import Actor from './actor';
import Screen from './screen';
import Random from './random';

export default class Game {
  maxActorCount = 100;
  actors: Actor[] = [];
  codes: any = {};
  ticks = -1;
  score = 0;
  missCount = 0;
  isValid = true;
  actorAddingCount = 0;
  random = new Random();
  autoPressingKeys = [37, 38, 39, 40];
  autoPressingRandom = new Random();

  constructor(public screen: Screen, public isKeyDown: boolean[],
    randomSeed: number = null,
    public isAutoKeyPressed = false) {
    if (randomSeed != null) {
      this.random.setSeed(randomSeed);
    }
    if (isAutoKeyPressed) {
      this.isKeyDown = _.times(256, () => false);
    }
  }

  begin() {
    this.addActor('stage');
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
    if (this.isAutoKeyPressed) {
      if (this.autoPressingRandom.get() < 0.2) {
        _.forEach(this.autoPressingKeys, k => {
          this.isKeyDown[k] = false;
        });
        if (this.autoPressingRandom.get() > 0.2) {
          this.isKeyDown[
            this.autoPressingKeys[
            this.autoPressingRandom.getInt(this.autoPressingKeys.length)
            ]
          ] = true;
        }
      }
    }
    this.screen.clear();
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

  miss() {
    this.actors = [];
    this.missCount++;
    this.begin();
  }

  addScore(score = 1) {
    this.score += score;
  }

  diff(otherGame: Game) {
    return this.screen.diff(otherGame.screen);
  }
}
