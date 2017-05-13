import * as parseSE from 's-expression';
import * as _ from 'lodash';
import Game from './game';
import Screen from './screen';
import Random from './random';

window.onload = init;

let baseCodeCount: number;
let baseCodes: any[];
let loadedBaseCodeCount = 0;
const codeCount = 100;
const codes = [];
let isKeyDown = _.times(256, () => false);
let random: Random;

function init() {
  document.getElementById('status').textContent = 'generating...';
  document.onkeydown = e => {
    isKeyDown[e.keyCode] = true;
  };
  document.onkeyup = e => {
    isKeyDown[e.keyCode] = false;
  };
  loadGameList();
}

function loadGameList() {
  loadFile('games.txt', text => {
    const list = _.filter(text.split('\n'), n => n.length > 0);
    baseCodeCount = list.length;
    baseCodes = _.times(baseCodeCount, () => null);
    _.forEach(list, (name, i) => {
      loadCode(name, i);
    });
  });
}

function loadCode(name: string, index: number) {
  loadFile(name, text => {
    const parsed = parseSE(text);
    if (parsed instanceof Error) {
      const err: any = parsed;
      console.error(`${err} line: ${err.line} col: ${err.col} (${name})`);
      return;
    }
    baseCodes[index] = parsed;
    loadedBaseCodeCount++;
    if (loadedBaseCodeCount >= baseCodeCount) {
      start();
    }
  });
}

function loadFile(name: string, callback: (name: string) => void) {
  const request = new XMLHttpRequest();
  request.open('GET', name);
  request.send();
  request.onload = () => {
    callback(request.responseText);
  };
}

function start() {
  random = new Random();
  //*
  _.times(codeCount, i => {
    codes.push(_.cloneDeep(baseCodes[i % baseCodeCount]));
  });
  _.times(codeCount * 10, () => {
    combine();
  });
  const sortedCodes = sortCodes();
  console.log(JSON.stringify(_.cloneDeep(sortedCodes[0].code), null, 2));
  console.log(sortedCodes[0].fitness);
  const game = new Game(new Screen(), isKeyDown);
  game.begin(sortedCodes[0].code);
  /*/
  const game = new Game(new Screen(), isKeyDown);
  game.begin(baseCodes[4]);
  //*/
  const updateFunc = () => {
    requestAnimationFrame(updateFunc);
    game.update();
  };
  updateFunc();
}

function sortCodes() {
  const scoredCodes = _.map(codes, code => {
    const fitness = addFitnessToCode(code);
    return { code, fitness };
  });
  return _(scoredCodes).sortBy('fitness').reverse().value();
}

function addFitnessToCode(code) {
  const games = _.times(2, i => {
    const game = new Game(new Screen(null), null, 0, i);
    game.begin(code);
    return game;
  });
  let score = 0;
  for (let i = 0; i < 100; i++) {
    let isValid = true;
    _.forEach(games, game => {
      game.update();
      if (!game.isValid) {
        isValid = false;
        return false;
      }
    });
    if (!isValid) {
      return 0;
    }
    score += games[0].diff(games[1]);
  }
  return score;
}

function combine() {
  const p1 = getCodePart(codes[random.getInt(codeCount)]);
  const p2 = getCodePart(codes[random.getInt(codeCount)]);
  p1.parent.splice(p1.index, 0, _.cloneDeep(p2.parent[p2.index]));
  p2.parent.splice(p2.index, 1);
}

function getCodePart(code: any[], targetDepth = 1, depth = 0) {
  let ci = random.getInt(code.length);
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
    depth >= targetDepth && random.get() > 0.5) {
    return { parent: code, index: ci };
  }
  return getCodePart(part, targetDepth, depth + 1);
}
