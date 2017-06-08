import * as _ from 'lodash';
import Game from './game';
import Screen from './screen';

export default class Actor {
  screen: Screen;
  pos = new Vector(-1, -1);
  prevPos = new Vector();
  vel = new Vector();
  resultValue: any;
  touchedActor: Actor;
  isAlive = true;
  ticks = 0;
  colorIndex = -1;
  parseCount = 0;
  freqNamePatterns = {
    'rarely': 0.05,
    'often': 0.1,
    'frequently': 0.2,
    'half': 0.5
  };
  defaultFreqName = 'often';
  durationNamePatterns = {
    'tick': 1,
    'soon': 5,
    'later': 10
  };
  defaultDurationName = 'soon';
  posNamePatterns = {
    'top_left': { x: 0, y: 0 },
    'bottom_left': { x: 0, y: 1 },
    'left_center': { x: 0, y: 0.5 },
    'top_right': { x: 1, y: 0 },
    'bottom_right': { x: 1, y: 1 },
    'right_center': { x: 1, y: 0.5 },
    'top_center': { x: 0.5, y: 0 },
    'bottom_center': { x: 0.5, y: 1 },
    'center': { x: 0.5, y: 0.5 },
    'top': { x: null, y: 0 },
    'bottom': { x: null, y: 1 },
    'left': { x: 0, y: null },
    'right': { x: 1, y: null }
  };
  defaultPosName = 'center';
  edgePosNames = [
    'top', 'bottom', 'left', 'right'
  ];
  keyNamePatterns = {
    'left': [65, 37],
    'right': [68, 39],
    'up': [87, 38],
    'down': [83, 40],
  };
  defaultKeyName = 'right';
  angleNamePatterns = {
    'left': new Vector(-1, 0),
    'right': new Vector(1, 0),
    'up': new Vector(0, -1),
    'down': new Vector(0, 1)
  };
  defaultAngleName = 'right';
  accelerateNamePatterns = {
    'very_fast': 0.3,
    'fast': 0.1,
    'normal': 0.03,
    'slow': 0.01,
    'very_slow': 0.003
  };
  defaultAccelerateName = 'normal';
  moveNamePatterns = {
    'very_fast': 3,
    'fast': 2,
    'normal': 1,
    'slow': 0.5,
    'very_slow': 0.25
  };
  defaultMoveName = 'normal';

  constructor(public name: string, public code: any[], public game: Game) {
    this.screen = game.screen;
    const ci = game.actorNames.indexOf(name) - 1;
    if (ci >= 0) {
      this.colorIndex = ci;
    }
  }

  update() {
    this.prevPos.set(this.pos);
    this.parseCount = 0;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.vel.x *= 0.99;
    this.vel.y *= 0.99;
    this.parse(_.cloneDeep(this.code));
    this.screen.setPoint(this.pos.x, this.pos.y, this.colorIndex);
    if (this.pos.x < -this.screen.width * 0.5 ||
      this.pos.x >= this.screen.width * 1.5 ||
      this.pos.y < -this.screen.height * 0.5 ||
      this.pos.y >= this.screen.height * 1.5) {
      this.remove();
    }
    this.ticks++;
  }

  remove() {
    this.isAlive = false;
  }

  parse(currentCode: any) {
    const stack = [];
    this.parseCount++;
    if (this.parseCount > 48) {
      this.game.isValid = false;
      return this.resultValue;
    }
    if (currentCode == null) {
      return this.resultValue;
    }
    for (let i = 0; i < 32; i++) {
      if (!(currentCode instanceof Array)) {
        currentCode = [currentCode];
      }
      if (currentCode.length <= 0) {
        if (stack.length <= 0) {
          return this.resultValue;
        }
        currentCode = stack.pop();
        continue;
      }
      const c = currentCode.shift();
      if (c instanceof Array) {
        stack.push(currentCode);
        currentCode = c;
        continue;
      }
      switch (c) {
        case 'if':
          const cond = currentCode.shift();
          const condResult = this.parse(cond);
          const thenCode = currentCode.shift();
          const elseCode = currentCode.shift();
          if (condResult) {
            this.parse(thenCode);
          } else {
            this.parse(elseCode);
          }
          break;
        case 'initial':
          this.resultValue = this.ticks === 0;
          break;
        case 'exists':
        case 'not_exists':
          const actorName = this.parse(currentCode.shift());
          if (c === 'exists') {
            this.resultValue = this.game.getActors(actorName).length > 0;
          } else {
            this.resultValue = this.game.getActors(actorName).length <= 0;
          }
          break;
        case 'random':
        case 'interval':
          const freqName = this.parse(currentCode.shift());
          let freq = this.freqNamePatterns[freqName];
          if (freq == null) {
            freq = this.freqNamePatterns[this.defaultFreqName];
          }
          if (c === 'random') {
            this.resultValue = this.game.random.get() < freq;
          } else {
            const it = Math.floor(1 / freq);
            this.resultValue = this.ticks % it === 0;
          }
          break;
        case 'before':
        case 'after':
          const durationName = this.parse(currentCode.shift());
          let duration = this.durationNamePatterns[durationName];
          if (duration == null) {
            duration = this.durationNamePatterns[this.defaultDurationName];
          }
          if (c === 'before') {
            this.resultValue = this.ticks < duration;
          } else {
            this.resultValue = this.ticks >= duration;
          }
          break;
        case 'key':
          if (this.game.isKeyDown == null) {
            this.resultValue = false;
            break;
          }
          const keyName = this.parse(currentCode.shift());
          let kp: number[] = this.keyNamePatterns[keyName];
          if (kp == null) {
            kp = this.keyNamePatterns[this.defaultKeyName];
          }
          this.resultValue = _.some(kp, k => this.game.isKeyDown[k]);
          break;
        case 'touch':
          const targetName = this.parse(currentCode.shift());
          this.resultValue = this.checkTouch(targetName);
          break;
        case 'select':
          const selectedIndex = this.game.random.getInt(currentCode.length);
          this.parse(currentCode[selectedIndex]);
          currentCode = [];
          break;
        case 'spawn':
          const spawningActorName = this.parse(currentCode.shift());
          const actor = this.game.addActor(spawningActorName);
          if (actor != null) {
            actor.pos.set(this.pos);
          }
          break;
        case 'place':
          this.place(currentCode);
          break;
        case 'move':
          this.move(currentCode);
          break;
        case 'accelerate':
          this.accelerate(currentCode);
          break;
        case 'remove':
          this.remove();
          break;
        case 'remove_touched':
          if (this.touchedActor != null) {
            this.touchedActor.remove();
          }
          break;
        case 'miss':
          this.game.miss();
          break;
        case 'score':
          this.game.addScore();
          break;
        default:
          this.resultValue = c;
          break;
      }
    }
  }

  checkTouch(targetName: string) {
    if (targetName == null) {
      return false;
    }
    const sw = this.screen.width;
    const sh = this.screen.height;
    const ti = this.game.actorNames.indexOf(targetName);
    if (ti >= 0) {
      this.touchedActor = null;
      const x = Math.floor(this.pos.x);
      const y = Math.floor(this.pos.y);
      return _.some(this.game.actors, a => {
        const isTouched = (a !== this && a.name === targetName &&
          Math.floor(a.pos.x) === x && Math.floor(a.pos.y) === y);
        if (isTouched) {
          this.touchedActor = a;
        }
        return isTouched;
      });
    }
    switch (targetName) {
      case 'out_of_screen':
        return this.pos.x < 0 || this.pos.x >= sw ||
          this.pos.y < 0 || this.pos.y >= sh;
      case 'out_of_screen_top':
        return this.pos.x >= 0 && this.pos.x < sw && this.pos.y < 0;
      case 'out_of_screen_bottom':
        return this.pos.x >= 0 && this.pos.x < sw && this.pos.y >= sh;
      case 'out_of_screen_left':
        return this.pos.y >= 0 && this.pos.y < sh && this.pos.x < 0;
      case 'out_of_screen_right':
        return this.pos.y >= 0 && this.pos.y < sh && this.pos.x >= sw;
    }
  }

  place(currentCode: any[]) {
    let posName = this.parse(currentCode.shift());
    if (posName === 'edge') {
      posName = this.edgePosNames[this.game.random.getInt(4)];
    }
    let pp = this.posNamePatterns[posName];
    if (pp == null) {
      pp = this.posNamePatterns[this.defaultPosName];
    }
    if (pp.x == null) {
      pp.x = this.game.random.get();
    }
    if (pp.y == null) {
      pp.y = this.game.random.get();
    }
    this.pos.set(
      Math.floor(pp.x * (this.screen.width - 0.01)),
      Math.floor(pp.y * (this.screen.height - 0.01)));
    this.prevPos.set(this.pos);
  }

  move(currentCode: any[]) {
    const moveName = this.parse(currentCode.shift());
    if (moveName === 'step_back') {
      this.pos.set(this.prevPos.x, this.prevPos.y);
      return;
    }
    let mp: Vector = this.angleNamePatterns[moveName];
    if (mp == null) {
      mp = this.angleNamePatterns[this.defaultAngleName];
    }
    const speedName = this.parse(currentCode.shift());
    let speed = this.moveNamePatterns[speedName];
    if (speed == null) {
      speed = this.moveNamePatterns[this.defaultMoveName];
    }
    this.pos.x += mp.x * speed;
    this.pos.y += mp.y * speed;
  }

  accelerate(currentCode: any[]) {
    const angleName = this.parse(currentCode.shift());
    if (angleName === 'bounce_horizontal') {
      this.vel.x *= -1;
      return;
    }
    if (angleName === 'bounce_vertical') {
      this.vel.y *= -1;
      return;
    }
    if (angleName === 'stop') {
      this.vel.set(0, 0);
      return;
    }
    if (angleName === 'slow_down') {
      this.vel.x *= 0.9;
      this.vel.y *= 0.9;
      return;
    }
    let ap = this.angleNamePatterns[angleName];
    if (angleName === 'to_player') {
      ap = this.getAngleTo('player');
    }
    if (ap == null) {
      ap = this.angleNamePatterns[this.defaultAngleName];
    }
    const speedName = this.parse(currentCode.shift());
    let sp = this.accelerateNamePatterns[speedName];
    if (sp == null) {
      sp = this.accelerateNamePatterns[this.defaultAccelerateName];
    }
    this.vel.x += ap.x * sp;
    this.vel.y += ap.y * sp;
  }

  getAngleTo(name: string) {
    const actors = this.game.getActors(name);
    let dist = 9999999;
    let target: Actor;
    let ox: number;
    let oy: number;
    _.forEach(actors, a => {
      if (a === this) {
        return;
      }
      ox = a.pos.x - this.pos.x;
      oy = a.pos.y - this.pos.y;
      const d = Math.sqrt(ox * ox + oy * oy);
      if (d < dist) {
        target = a;
        dist = d;
      }
    });
    if (target == null) {
      return null;
    }
    const angle = Math.atan2(oy, ox);
    return new Vector(Math.cos(angle), Math.sin(angle));
  }
}

class Vector {
  x = 0;
  y = 0;

  constructor(x: number | Vector = null, y: number = null) {
    if (x != null) {
      this.set(x, y);
    }
  }

  set(x: number | Vector, y: number = null) {
    if (x instanceof Vector) {
      this.x = x.x;
      this.y = x.y;
      return;
    }
    this.x = x;
    this.y = y;
  }
}
