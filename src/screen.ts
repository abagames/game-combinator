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
  playOrBackButton: HTMLInputElement;

  constructor(public hasDom = true,
    public mode = 'generated',
    public width = 15, public height = 15) {
    this.pixels = _.times(width, () => _.times(height, () => -1));
    if (!hasDom) {
      return;
    }
    const styleSize = mode === 'generated' ? 100 : 300;
    this.canvas = <HTMLCanvasElement>document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.cssText = `
width: ${styleSize}px;
height: ${styleSize}px;
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
    if (mode === 'generated') {
      this.likedCheckBox = document.createElement('input');
      this.likedCheckBox.type = 'checkbox';
      this.likedCheckBox.checked = true;
      document.body.appendChild(this.likedCheckBox);
    }
    if (mode !== 'loaded') {
      this.playOrBackButton = document.createElement('input');
      this.playOrBackButton.type = 'button';
      this.playOrBackButton.value = mode === 'generated' ? 'Play' : 'Back';
      document.body.appendChild(this.playOrBackButton);
    }
  }

  setOnButtonClicked(handler: (this: HTMLElement, e: MouseEvent) => any) {
    this.playOrBackButton.onclick = handler;
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
    if (this.mode === 'generated') {
      document.body.removeChild(this.likedCheckBox);
    }
    if (this.mode !== 'loaded') {
      document.body.removeChild(this.playOrBackButton);
    }
  }
}
