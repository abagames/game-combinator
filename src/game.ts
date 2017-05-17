import * as _ from 'lodash';
import Actor from './actor';
import Screen from './screen';
import Random from './random';

export default class Game {
  maxActorCount = 100;
  actors: Actor[];
  codes: any = {};
  ticks = -1;
  isAlive = true;
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
    this.update = this.update.bind(this);
  }

  begin(gameCode) {
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
    this.restart();
    if (this.screen.hasDom) {
      this.update();
    }
  }

  restart() {
    this.actors = [];
    this.addActor('stage');
  }

  end() {
    this.isAlive = false;
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

  getActors(name: string) {
    return _.filter(this.actors, a => a.name === name);
  }

  update() {
    if (!this.isAlive) {
      return;
    }
    if (this.screen.hasDom) {
      requestAnimationFrame(this.update);
    } else {
      this.score = this.missCount = 0;
    }
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
    this.restart();
  }

  addScore(score = 1) {
    this.score += score;
  }

  diff(otherGame: Game) {
    return {
      screen: this.screen.diff(otherGame.screen),
      score: Math.abs(this.score - otherGame.score),
      miss: Math.abs(this.missCount - otherGame.missCount)
    };
    /*let value = 0;
    value += Math.sqrt(this.screen.diff(otherGame.screen));
    value += Math.sqrt(Math.abs(this.score - otherGame.score));
    value += Math.sqrt(Math.abs(this.missCount - otherGame.missCount));
    return value;*/
  }
}
