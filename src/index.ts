import * as parseSE from 's-expression';
import * as _ from 'lodash';
import Game from './game';
import Screen from './screen';
import Random from './random';

window.onload = init;

const codeCount = 250;
const genCount = 5;
const aliveRatio = 0.25;
let baseCodeCount: number;
let baseCodes: any[];
let loadedBaseCodeCount = 0;
let codeSeed: number;
let codes: { code: any[], fitness: number }[];
let codeIndex: number;
let codesWithFitness: { code: any[], fitness: number }[];
let fitnessIndex: number;
let genIndex: number;
let random: Random;
let isKeyDown = _.times(256, () => false);
let currentGame: Game;

function init() {
  initEventHandlers();
  loadGameList();
}

function initEventHandlers() {
  document.onkeydown = e => {
    isKeyDown[e.keyCode] = true;
  };
  document.onkeyup = e => {
    isKeyDown[e.keyCode] = false;
  };
  document.getElementById('prev').onclick = e => {
    moveCodeIndex(-1);
  };
  document.getElementById('next').onclick = e => {
    moveCodeIndex(1);
  };
  document.getElementById('restart').onclick = e => {
    moveCodeIndex(0);
  };
  document.getElementById('regenerate').onclick = e => {
    beginGenerating();
  };
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
      beginGenerating();
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

function beginGenerating(randomSeed: number = null) {
  enableButtons(false);
  if (currentGame != null) {
    currentGame.end();
  }
  genIndex = 0;
  codeSeed = randomSeed != null ? randomSeed : new Random().getToMaxInt();
  random = new Random().setSeed(codeSeed);
  codes = _.times(codeCount, i => {
    return {
      code: _.cloneDeep(baseCodes[i % baseCodeCount]),
      fitness: 0
    };
  });
  setTimeout(goToNextGen, 1);
}

function endGenerating() {
  codeIndex = 0;
  beginGame();
}

function moveCodeIndex(offset: number) {
  enableButtons(false);
  currentGame.end();
  codeIndex += offset;
  if (codeIndex < 0) {
    codeIndex += codeCount;
  } else if (codeIndex >= codeCount) {
    codeIndex -= codeCount;
  }
  beginGame();
}

function beginGame() {
  //console.log(JSON.stringify(_.cloneDeep(codes[codeIndex].code), null, 2));
  const fitness = Math.floor(codes[codeIndex].fitness);
  showInfo(`id: ${codeSeed}#${codeIndex} fitness: ${fitness}`);
  currentGame = new Game(new Screen(), isKeyDown);
  currentGame.begin(codes[codeIndex].code);
  enableButtons();
}

function goToNextGen() {
  _.times(codeCount * 3, () => {
    combine();
  });
  sortCodes();
}

function sortCodes() {
  codesWithFitness = [];
  fitnessIndex = 0;
  setTimeout(addFitnessToCode, 1);
}

function endSortingCodes() {
  codes = _(codesWithFitness).sortBy('fitness').reverse().value();
  genIndex++;
  if (genIndex >= genCount) {
    endGenerating();
  } else {
    const aliveCodeCount = Math.floor(codeCount * aliveRatio);
    codes = _.times(codeCount, i => _.cloneDeep(codes[i % aliveCodeCount]));
    setTimeout(goToNextGen, 1);
  }
}

function addFitnessToCode() {
  showInfo(`generating... ${genIndex + 1} / ${genCount} : ${fitnessIndex} / ${codeCount}`);
  const code = codes[fitnessIndex].code;
  const games = _.times(2, i => {
    const game = new Game(new Screen(null), null, 0, i);
    game.begin(code);
    return game;
  });
  let fitness = 0;
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
      fitness = 0;
      break;
    }
    fitness += games[0].diff(games[1]);
  }
  codesWithFitness.push({ code, fitness });
  fitnessIndex++;
  if (fitnessIndex >= codeCount) {
    endSortingCodes();
  } else {
    setTimeout(addFitnessToCode, 0);
  }
}

function combine() {
  const p1 = getCodePart(codes[random.getInt(codeCount)].code);
  const p2 = getCodePart(codes[random.getInt(codeCount)].code);
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

function enableButtons(isEnabled = true) {
  const buttonIds = ['prev', 'next', 'restart', 'regenerate'];
  _.forEach(buttonIds, id => {
    (<HTMLButtonElement>document.getElementById(id)).disabled = !isEnabled;
  });
}

function showInfo(text: string) {
  document.getElementById('game_info').textContent = text;
}
