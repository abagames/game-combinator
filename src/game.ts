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
  isAutoPressing = false;
  autoPressingKeys = [37, 38, 39, 40];
  autoPressingRandom = new Random();
  actorNames = ['stage', 'player', 'enemy', 'shot', 'bullet'];

  constructor(public screen: Screen, public isKeyDown: boolean[],
    randomSeed: number = null,
    autoPressingRandomSeed: number = null) {
    if (randomSeed != null) {
      this.random.setSeed(randomSeed);
    }
    if (autoPressingRandomSeed != null) {
      this.autoPressingRandom.setSeed(autoPressingRandomSeed);
      this.isAutoPressing = true;
      this.isKeyDown = _.times(256, () => false);
    }
  }

  begin(gameCode = null) {
    if (gameCode != null) {
      const code = _.cloneDeep(gameCode);
      code.splice(0, 2); // Remove 'game', [name]
      _.forEach(code, ac => {
        const name = ac[1];
        if (_.some(this.actorNames, an => an === name)) {
          ac.splice(0, 2); // Remove 'actor', [name]
          this.codes[name] = ac;
        }
      });
    }
    this.addActor('stage');
  }

  addActor(name: string) {
    this.actorAddingCount++;
    if (this.actorAddingCount > 16) {
      this.isValid = false;
      return null;
    }
    if (!this.codes.hasOwnProperty(name)) {
      //console.log(`Actor '${name}' is not defined`);
      return null;
    }
    const actor = new Actor(name, this.codes[name], this);
    this.actors.push(actor);
    return actor;
  }

  update() {
    this.ticks++;
    if (this.screen.hasDom && this.ticks % 10 > 0) {
      return;
    }
    if (this.isAutoPressing) {
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
    this.screen.showStatus(`score: ${this.score}  miss: ${this.missCount}`);
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
    let value = 0;
    value += this.screen.diff(otherGame.screen);
    value += Math.abs(this.score - otherGame.score);
    value += Math.abs(this.missCount - otherGame.missCount);
    return value;
  }
}
