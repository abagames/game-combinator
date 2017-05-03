export default class Screen {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  hasDom = true;

  constructor(domId = 'main', public width = 15, public height = 15) {
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
  }

  setPoint(x: number, y: number, color = 'black') {
    if (!this.hasDom) {
      return;
    }
    this.context.fillStyle = color;
    this.context.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }
}
