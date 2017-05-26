import * as _ from 'lodash';

export default class Screen {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pixels: number[][];
  colorPatterns = [
    '#8f8', '#f88', '#88f', '#f8f'
  ];
  tile: HTMLLIElement;
  statusDom: HTMLElement;
  likedCheckBox: HTMLInputElement;
  playOrBackButton: HTMLButtonElement;

  constructor(public hasDom = true,
    public mode = 'generated',
    public width = 15, public height = 15) {
    this.pixels = _.times(width, () => _.times(height, () => -1));
    if (!hasDom) {
      return;
    }
    this.tile = document.createElement('li');
    this.tile.className = 'mdc-grid-tile';
    if (mode !== 'generated') {
      this.tile.style.cssText = 'width: 380px';
    }
    const primary = document.createElement('div');
    primary.className = 'mdc-grid-tile__primary';
    primary.style.cssText = 'text-align: center; color: white';
    this.statusDom = document.createElement('div');
    primary.appendChild(this.statusDom);
    const styleSize = mode === 'generated' ? 120 : 300;
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
    primary.appendChild(this.canvas);
    const secondary = document.createElement('div');
    secondary.className = 'mdc-grid-tile__secondary';
    if (mode === 'generated') {
      const checkbox = document.createElement('div');
      checkbox.className = 'mdc-checkbox';
      checkbox.style.cssText = 'top: -12px; float: left';
      this.likedCheckBox = document.createElement('input');
      this.likedCheckBox.type = 'checkbox';
      this.likedCheckBox.className = 'mdc-checkbox__native-control';
      this.likedCheckBox.checked = true;
      checkbox.appendChild(this.likedCheckBox);
      const div = document.createElement('div');
      div.className = 'mdc-checkbox__background';
      div.innerHTML = `
<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24">
  <path class="mdc-checkbox__checkmark__path"
        fill="none"
        stroke="white"
        d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
</svg>
<div class="mdc-checkbox__mixedmark"></div>
      `;
      checkbox.appendChild(div);
      const label = document.createElement('label');
      label.textContent = 'Like';
      secondary.appendChild(checkbox);
      secondary.appendChild(label);
    }
    if (mode !== 'loaded') {
      this.playOrBackButton = document.createElement('button');
      this.playOrBackButton.className = 'mdc-button';
      this.playOrBackButton.textContent = mode === 'generated' ? 'Play' : 'Back';
      this.playOrBackButton.style.cssText = 'top: -10px; float: right';
      secondary.appendChild(this.playOrBackButton);
    }
    this.tile.appendChild(primary);
    this.tile.appendChild(secondary);
    document.getElementById('tiles').appendChild(this.tile);
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
    document.getElementById('tiles').removeChild(this.tile);
  }
}
