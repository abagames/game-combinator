export default class Actor {
  static codes;
  pos: Vector;
  vel: Vector;
  code: any[];

  constructor(public name: string) {
    this.code = Actor.codes[name];
    console.log(this.code);
  }
}

class Vector {
  x = 0;
  y = 0;
}