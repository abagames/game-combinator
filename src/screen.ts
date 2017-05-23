import * as _ from 'lodash';

export default class Screen {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pixels: number[][];
  colorPatterns = [
    '#8f8', '#f88', '#88f', '#f8f'
  ];
  statusDom: HTMLElement;
  likedCheckBox: HTMLInputElement;

  constructor(public hasDom = true, public width = 15, public height = 15) {
    this.pixels = _.times(width, () => _.times(height, () => -1));
    if (!hasDom) {
      return;
    }
    this.canvas = <HTMLCanvasElement>document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.cssText = `
width: 100px;
height: 100px;
background: white;
image-rendering: -moz-crisp-edges;
image-rendering: -webkit-optimize-contrast;
image-rendering: -o-crisp-edges;
image-rendering: pixelated;
    `;
    this.context = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    this.statusDom = document.createElement('span');
    document.body.appendChild(this.statusDom);
    this.likedCheckBox = document.createElement('input');
    this.likedCheckBox.type = 'checkbox';
    this.likedCheckBox.checked = true;
    document.body.appendChild(this.likedCheckBox);
  }

  clear() {
    if (!this.hasDom) {
      return;
    }
    this.context.clearRect(0, 0, this.width, this.height);
    _.times(this.width, x => _.times(this.height, y => {
      this.pixels[x][y] = -1;
    }));
  }

  setPoint(x: number, y: number, colorIndex = -1) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (colorIndex === -1 ||
      px < 0 || px >= this.width || py < 0 || py >= this.height) {
      return;
    }
    this.pixels[px][py] = colorIndex;
    if (!this.hasDom) {
      return;
    }
    this.context.fillStyle = this.colorPatterns[colorIndex];
    this.context.fillRect(px, py, 1, 1);
  }

  diff(otherScreen: Screen) {
    let score = 0;
    _.times(this.width, x => {
      _.times(this.height, y => {
        if (this.pixels[x][y] !== otherScreen.pixels[x][y]) {
          score++;
        }
      });
    });
    return score;
  }

  showStatus(text: string) {
    if (!this.hasDom) {
      return;
    }
    this.statusDom.textContent = text;
  }

  remove() {
    document.body.removeChild(this.canvas);
    document.body.removeChild(this.statusDom);
    document.body.removeChild(this.likedCheckBox);
  }
}
