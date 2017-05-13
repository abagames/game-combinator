import * as _ from 'lodash';
import Game from './game';
import Screen from './screen';

export default class Actor {
  screen: Screen;
  pos = new Vector(-1, -1);
  prevPos = new Vector();
  vel = new Vector();
  isInitial = true;
  resultValue: any;
  isAlive = true;
  colorIndex = -1;
  parseCount = 0;
  freqNamePatterns = {
    'rarely': 0.05,
    'often': 0.1,
    'frequently': 0.2
  };
  posNamePatterns = {
    'top_left': { x: 0, y: 0 },
    'bottom_left': { x: 0, y: 1 },
    'left_center': { x: 0, y: 0.5 },
    'top': { x: null, y: 0 },
    'right': { x: 1, y: null }
  };
  keyNamePatterns = {
    'left': [65, 37],
    'right': [68, 39],
    'up': [87, 38],
    'down': [83, 40],
  };
  angleNamePatterns = {
    'left': new Vector(-1, 0),
    'right': new Vector(1, 0),
    'up': new Vector(0, -1),
    'down': new Vector(0, 1)
  };
  accelerateNamePatterns = {
    'fast': 0.1,
    'normal': 0.03,
    'slow': 0.01
  };
  colorIndices = ['player', 'item'];

  constructor(public name: string, public code: any[], public game: Game) {
    this.screen = game.screen;
    const ci = this.colorIndices.indexOf(name);
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
    this.isInitial = false;
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
          this.resultValue = this.isInitial;
          break;
        case 'spawn':
          const actorName = this.parse(currentCode.shift());
          this.game.addActor(actorName);
          break;
        case 'random':
          const freqName = this.parse(currentCode.shift());
          const ratio = this.freqNamePatterns[freqName];
          if (ratio == null) {
            this.resultValue = false;
          } else {
            this.resultValue = this.game.random.get() < ratio;
          }
          break;
        case 'place':
          const posName = this.parse(currentCode.shift());
          const pp = this.posNamePatterns[posName];
          if (pp != null) {
            if (pp.x == null) {
              pp.x = this.game.random.get();
            }
            if (pp.y == null) {
              pp.y = this.game.random.get();
            }
            this.pos.set(
              Math.floor(pp.x * (this.screen.width - 0.01)),
              Math.floor(pp.y * (this.screen.height - 0.01)));
          }
          break;
        case 'key':
          if (this.game.isKeyDown == null) {
            this.resultValue = false;
            break;
          }
          const keyName = this.parse(currentCode.shift());
          const kp: number[] = this.keyNamePatterns[keyName];
          this.resultValue = (kp != null && _.some(kp, k => this.game.isKeyDown[k]));
          break;
        case 'move':
          const moveName = this.parse(currentCode.shift());
          if (moveName === 'step_back') {
            this.pos.set(this.prevPos.x, this.prevPos.y);
            break;
          }
          const mp: Vector = this.angleNamePatterns[moveName];
          if (mp != null) {
            this.pos.x += mp.x;
            this.pos.y += mp.y;
          }
          break;
        case 'touch':
          const targetName = this.parse(currentCode.shift());
          this.resultValue = this.checkTouch(targetName);
          break;
        case 'accelerate':
          const angleName = this.parse(currentCode.shift());
          if (angleName === 'bounce_vertical') {
            this.vel.y *= -1;
            break;
          }
          const speedName = this.parse(currentCode.shift());
          const ap = this.angleNamePatterns[angleName];
          const sp = this.accelerateNamePatterns[speedName];
          if (ap != null && sp != null) {
            this.vel.x += ap.x * sp;
            this.vel.y += ap.y * sp;
          }
          break;
        case 'miss':
          this.game.miss();
          break;
        case 'score':
          this.game.addScore();
          break;
        case 'remove':
          this.remove();
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
    switch (targetName) {
      case 'out_of_screen':
        return this.pos.x < 0 || this.pos.x >= sw ||
          this.pos.y < 0 || this.pos.y >= sh;
      case 'out_of_screen_bottom':
        return this.pos.x >= 0 && this.pos.x < sw && this.pos.y >= sh;
      case 'out_of_screen_right':
        return this.pos.y >= 0 && this.pos.y < sh && this.pos.x >= sw;
      case 'player':
      case 'item':
        const x = Math.floor(this.pos.x);
        const y = Math.floor(this.pos.y);
        return _.some(this.game.actors, a =>
          (a !== this && a.name === targetName &&
            Math.floor(a.pos.x) === x && Math.floor(a.pos.y) === y));
    }
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
