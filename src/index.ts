import * as parseSE from 's-expression';

window.onload = init;

const codeCount = 1;
const codes = [];

function init() {
  loadCode('fire.gc');
}

function loadCode(name: string) {
  const request = new XMLHttpRequest();
  request.open('GET', name);
  request.send();
  request.onload = () => {
    codes.push(parseSE(request.responseText));
    if (codes.length >= codeCount) {
      start();
    }
  };
}

function start() {
  console.log(codes[0]);
}
