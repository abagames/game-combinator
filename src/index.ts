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
    combine()
  });
  const sortedCodes = sortCodes();
  console.log(JSON.stringify(_.cloneDeep(sortedCodes[0].code), null, 2));
  console.log(sortedCodes[0].score);
  const game = new Game(new Screen(), isKeyDown);
  beginGame(sortedCodes[0].code, game);
  /*/
  const game = new Game(new Screen(), isKeyDown);
  beginGame(baseCodes[3], game);
  //*/
  const updateFunc = () => {
    requestAnimationFrame(updateFunc);
    game.update();
  };
  updateFunc();
}

function beginGame(gameCode: any, game: Game) {
  const code = _.cloneDeep(gameCode);
  code.splice(0, 2); // Remove 'game', [name]
  const actorNames = ['stage', 'player', 'item', 'shot'];
  _.forEach(code, ac => {
    const name = ac[1];
    if (_.some(actorNames, an => an === name)) {
      ac.splice(0, 2); // Remove 'actor', [name]
      game.codes[name] = ac;
    }
  });
  game.begin();
}

function sortCodes() {
  const scoredCodes = _.map(codes, code => {
    const score = addScoreToCode(code);
    return { code, score };
  });
  return _(scoredCodes).sortBy('score').reverse().value();
}

function addScoreToCode(code) {
  const games = _.times(2, i => {
    const game = new Game(new Screen(null), null, 0, i === 1);
    beginGame(code, game);
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
  /*let cp1 = _.cloneDeep(p1.parent[p1.index]);
  let cp2 = _.cloneDeep(p2.parent[p2.index]);
  p1.parent[p1.index] = cp2;
  p2.parent[p2.index] = cp1;*/
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
