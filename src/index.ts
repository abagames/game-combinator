import * as parseSE from 's-expression';
import * as _ from 'lodash';
import Game from './game';
import Screen from './screen';
import Random from './random';

window.onload = init;

const codeCount = 100;
const aliveCount = 10;
const crossoverCount = 5;
const fitnessCalcTicks = 100;
let baseCodeCount: number;
let baseCodeNames: string[];
let baseCodes: any[];
let baseCodesDiffParams: any;
let loadedBaseCodeCount = 0;
let codeSeed: number;
let codes: { code: any[], fitness: number }[];
let codeIndex: number;
let codesWithFitness: { code: any[], fitness: number }[];
let fitnessIndex: number;
let random: Random;
let isKeyDown = _.times(256, () => false);
let games: Game[] = [];
let isLiked: boolean[] = [];
let isGamesBegun = false;

function init() {
  initEventHandlers();
  loadGameList();
  update();
}

function initEventHandlers() {
  document.onkeydown = e => {
    isKeyDown[e.keyCode] = true;
  };
  document.onkeyup = e => {
    isKeyDown[e.keyCode] = false;
  };
  document.getElementById('generate').onclick = () => {
    beginGenerating();
  };
  document.getElementById('generate_from_liked').onclick = () => {
    goToNextGeneration();
  };
}

function loadGameList() {
  loadFile('games.txt', text => {
    baseCodeNames = _.filter(text.split('\n'), n => n.length > 0);
    baseCodeNames = _.map(baseCodeNames, n => n.trim());
    baseCodeCount = baseCodeNames.length;
    baseCodes = _.times(baseCodeCount, () => null);
    _.forEach(baseCodeNames, loadCode);
  });
}

function loadCode(name: string, index: number) {
  loadFile(`codes/${name}`, text => {
    const parsed = parseSE(text);
    if (parsed instanceof Error) {
      const err: any = parsed;
      console.error(`${err} line: ${err.line} col: ${err.col} (${name})`);
      return;
    }
    baseCodes[index] = parsed;
    loadedBaseCodeCount++;
    if (loadedBaseCodeCount >= baseCodeCount) {
      calcBaseCodesDiffParams();
      beginGenerating();
      //beginBaseGame('fire.gc');
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

function beginBaseGame(name: string) {
  const code = baseCodes[baseCodeNames.indexOf(name)];
  console.log(calcFitness(code));
  games = [beginGame({ code, fitness: 0 }, 'loaded')];
  beginGames();
}

function beginGenerating(randomSeed: number = null) {
  enableButtons(false);
  endGames();
  codeSeed = randomSeed != null ? randomSeed : new Random().getToMaxInt();
  random = new Random().setSeed(codeSeed);
  const codeOffset = random.getInt(baseCodeCount);
  codes = _.times(codeCount, i => {
    return {
      code: _.cloneDeep(baseCodes[(i + codeOffset) % baseCodeCount]),
      fitness: 0
    };
  });
  setTimeout(crossoverCodes, 1);
}

function goToNextGeneration() {
  enableButtons(false);
  endGames();
  let likedCodes = [];
  _.forEach(games, g => {
    if (g.screen.likedCheckBox.checked) {
      likedCodes.push(g.originalCode);
    }
  });
  if (likedCodes.length <= 0) {
    beginGenerating();
    return;
  }
  const codeOffset = random.getInt(baseCodeCount);
  codes = _.times(codeCount, i => {
    let code;
    if (i <= codeCount * 0.8) {
      code = _.cloneDeep(likedCodes[i % likedCodes.length]);
    } else {
      code = _.cloneDeep(baseCodes[(i + codeOffset) % baseCodeCount]);
    }
    return {
      code,
      fitness: 0
    };
  });
  setTimeout(crossoverCodes, 1);
}

function beginGeneratedGames() {
  games = _.map(codes, c => beginGame(c));
  _.forEach(isLiked, (il, i) => {
    games[i].screen.likedCheckBox.checked = il;
  });
  enableButtons();
  beginGames();
}

function beginGames() {
  showInfo('Use [WASD] keys to control');
  isGamesBegun = true;
}

function endGames() {
  isGamesBegun = false;
  _.forEach(games, g => {
    g.end();
  });
}

function update() {
  requestAnimationFrame(update);
  if (!isGamesBegun) {
    return;
  }
  _.forEach(games, g => {
    g.update();
  });
}

function beginGame(code: any, mode = 'generated') {
  const fitness = Math.floor(code.fitness);
  const screen = new Screen(true, mode);
  const game = new Game(screen, isKeyDown);
  if (mode === 'generated') {
    screen.setOnButtonClicked(() => {
      _.forEach(games, (g, i) => {
        isLiked[i] = games[i].screen.likedCheckBox.checked;
      });
      endGames();
      enableButtons(false);
      games = [beginGame({ code: game.originalCode, fitness: 0 }, 'selected')];
      beginGames();
    });
  } else if (mode === 'selected') {
    screen.setOnButtonClicked(() => {
      endGames();
      beginGeneratedGames();
    });
  }
  game.begin(code.code);
  return game;
}

function crossoverCodes() {
  _.times(codeCount * crossoverCount, i => {
    crossover(i % codeCount);
  });
  selectCodes();
}

function selectCodes() {
  codesWithFitness = [];
  fitnessIndex = 0;
  setTimeout(addFitnessToCode, 1);
}

function endSelectingCodes() {
  let ci = 0;
  _.times(codeCount - aliveCount, () => {
    let nci = ci + 1;
    if (nci >= codesWithFitness.length) {
      nci = 0;
    }
    const si = (codesWithFitness[ci].fitness > codesWithFitness[nci].fitness) ? nci : ci;
    codesWithFitness.splice(si, 1);
    ci++;
    if (ci >= codesWithFitness.length) {
      ci = 0;
    }
  });
  codes = codesWithFitness;
  isLiked = _.times(aliveCount, () => true);
  beginGeneratedGames();
}

function addFitnessToCode() {
  showInfo(`Generating... ${fitnessIndex} / ${codeCount}`);
  const code = codes[fitnessIndex].code;
  const fitness = calcFitness(code);
  codesWithFitness.push({ code, fitness });
  fitnessIndex++;
  if (fitnessIndex >= codeCount) {
    endSelectingCodes();
  } else {
    setTimeout(addFitnessToCode, 0);
  }
}

const diffParams = ['screen', 'score', 'miss'];

function calcFitness(code: any[]) {
  const diff = calcDiff(code);
  if (diff == null) {
    return 0;
  }
  let fitness = 0;
  _.forEach(diffParams, p => {
    const dp = baseCodesDiffParams[p];
    fitness += fitnessValue(diff[p], dp.min, dp.median, dp.max);
  });
  return fitness;
}

function calcDiff(code: any[]) {
  const gameCount = 8;
  const games = _.times(gameCount, i => {
    const game = new Game(new Screen(false), null, 0, i);
    game.begin(code);
    return game;
  });
  const result: any = {};
  _.forEach(diffParams, p => {
    result[p] = 0;
  });
  for (let i = 0; i < fitnessCalcTicks; i++) {
    let isValid = true;
    _.forEach(games, game => {
      game.update();
      if (!game.isValid) {
        isValid = false;
        return false;
      }
    });
    if (!isValid) {
      return null;
    }
    for (let j = 0; j < gameCount - 1; j++) {
      for (let k = j + 1; k < gameCount; k++) {
        const diff = games[j].diff(games[k]);
        _.forEach(diffParams, p => {
          result[p] += diff[p];
        });
      }
    }
  }
  return result;
}

function calcBaseCodesDiffParams() {
  baseCodesDiffParams = {};
  _.forEach(diffParams, p => {
    baseCodesDiffParams[p] = {};
    baseCodesDiffParams[p].values = [];
  });
  let codeCount = 0;
  _.forEach(baseCodes, c => {
    const diff = calcDiff(c);
    if (diff == null) {
      return;
    }
    _.forEach(diffParams, p => {
      baseCodesDiffParams[p].values.push(diff[p]);
    });
  });
  _.forEach(diffParams, p => {
    const dp = baseCodesDiffParams[p];
    const vs = dp.values;
    const svs = _.sortBy(vs);
    dp.min = svs[0];
    dp.median = svs[Math.floor(svs.length / 2)];
    dp.max = svs[svs.length - 1];
  });
  return baseCodesDiffParams;
}

function fitnessValue(v: number, min: number, center: number, max: number) {
  if (v <= min || v >= max) {
    return 0;
  }
  if (v < center) {
    return (v - min) / (center - min) * 100;
  } else {
    return (max - v) / (max - center) * 100;
  }
}

function crossover(codeIndex: number) {
  const p1 = getCodePart(codes[codeIndex].code);
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
  const buttonIds = ['generate', 'generate_from_liked'];
  _.forEach(buttonIds, id => {
    (<HTMLButtonElement>document.getElementById(id)).disabled = !isEnabled;
  });
}

function showInfo(text: string) {
  document.getElementById('game_info').textContent = text;
}
