export default class Screen {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(domId = 'main') {
    this.canvas = <HTMLCanvasElement>document.getElementById(domId);
    this.context = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  setPoint(x: number, y: number, color = 'black') {
    this.context.fillStyle = color;
    this.context.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }
}
