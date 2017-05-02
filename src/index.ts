import * as parseSE from 's-expression';
import * as _ from 'lodash';
import Game from './game';
import Screen from './screen';

window.onload = init;

const codeCount = 2;
const codes = [];
let isKeyDown = _.times(256, () => false);
let game: Game;

function init() {
  document.onkeydown = e => {
    isKeyDown[e.keyCode] = true;
  };
  document.onkeyup = e => {
    isKeyDown[e.keyCode] = false;
  };
  loadCode('fire.gc');
  loadCode('helmet.gc');
}

function loadCode(name: string) {
  const request = new XMLHttpRequest();
  request.open('GET', name);
  request.send();
  request.onload = () => {
    const parsed = parseSE(request.responseText);
    if (parsed instanceof Error) {
      const err: any = parsed;
      console.error(`${err} line: ${err.line} col: ${err.col} (${name})`);
      return;
    }
    codes.push(parsed);
    if (codes.length >= codeCount) {
      start();
    }
  };
}

function start() {
  //_.times(10, () => combine());
  game = new Game(new Screen(), isKeyDown);
  createActorCodes();
  update();
}

function update() {
  requestAnimationFrame(update);
  game.update();
}

function createActorCodes() {
  const code = codes[0];
  code.splice(0, 2); // Remove 'game', [name]
  const actorNames = ['stage', 'player', 'item'];
  _.forEach(code, ac => {
    const name = ac[1];
    if (_.some(actorNames, an => an === name)) {
      ac.splice(0, 2); // Remove 'actor', [name]
      game.codes[name] = ac;
    }
  });
  game.addActor('stage');
}

function combine() {
  const ci = Math.floor(Math.random() * 2);
  const p1 = getCodePart(codes[ci]);
  const p2 = getCodePart(codes[(ci + 1) % 2]);
  p1.parent.splice(p1.index, 0, p2.parent[p2.index]);
  p2.parent.splice(p2.index, 1);
}

function getCodePart(code: any[], targetDepth = 1, depth = 0) {
  let ci = Math.floor(Math.random() * code.length);
  let part;
  for (let i = 0; i < code.length; i++) {
    part = code[ci];
    if (part instanceof Array) {
      break;
    }
    ci++;
    if (ci >= code.length) {
      ci = 0;
    }
  }
  if (!(part instanceof Array) ||
    depth >= targetDepth && Math.random() > 0.5) {
    return { parent: code, index: ci };
  }
  return getCodePart(part, targetDepth, depth + 1);
}
