import * as _ from 'lodash';

export default class Screen {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  hasDom = true;
  pixels: number[][];
  colorPatterns = [
    '#8f8', '#f88', '#88f'
  ];

  constructor(domId = 'main', public width = 15, public height = 15) {
    this.pixels = _.times(width, () => _.times(height, () => -1));
    if (domId == null) {
      this.hasDom = false;
      return;
    }
    this.canvas = <HTMLCanvasElement>document.getElementById(domId);
    this.context = this.canvas.getContext('2d');
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
}
