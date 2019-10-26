import { isPoint, isSize, Point, Rect, Size } from "./geom";

export class Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  /*
     | a c e |     | scaleX skewY tx |
     | b d f | <-> | skewX scaleY ty |
     | 0 0 1 |     | 0      0     1  |
   */
  constructor(
    a: number = 1, //scaleX
    b: number = 0, //skewX
    c: number = 0, //skewY
    d: number = 1, //scaleY
    e: number = 0, //tx
    f: number = 0 // ty
  ) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  clone(): Matrix2D {
    return new Matrix2D(this.a, this.b, this.c, this.d, this.e, this.f);
  }

  invert() {
    const a1 = this.a;
    const b1 = this.b;
    const c1 = this.c;
    const d1 = this.d;
    const tx1 = this.e;
    const n = a1 * d1 - b1 * c1;
    const a = d1 / n;
    const b = -b1 / n;
    const c = -c1 / n;
    const d = a1 / n;
    const e = (c1 * this.f - d1 * tx1) / n;
    const f = -(a1 * this.f - b1 * tx1) / n;
    return new Matrix2D(a, b, c, d, e, f);
  }

  applyTo<T extends Point | Size | Rect>(target: T): T {
    if (isPoint(target)) {
      target.x = target.x * this.a + this.e;
      target.y = target.y * this.d + this.f;
    }
    if (isSize(target)) {
      target.width *= this.a;
      target.height *= this.d;
    }
    return target;
  }

  applied<T extends Point | Size | Rect>(target: T): Rect {
    let x = 0,
      y = 0,
      width = 0,
      height = 0;
    if (isPoint(target)) {
      [x, y] = this.cross(target.x, target.y);
    }
    if (isSize(target)) {
      [width, height] = [target.width * this.a, target.height * this.d];
    }
    return { x, y, width, height };
  }

  set(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): Matrix2D {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
    return this;
  }

  /*
     | a c e |   | g i k |   | ag+ch ai+cj ak+cl+e |
     | b d f | * | h j l | = | bg+dh bi+dj bk+dl+f |
     | 0 0 1 |   | 0 0 1 |   | 0     0     1       |
   */

  // prettier-ignore
  append(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): Matrix2D {
    const {a, b, c, d, e, f} = this;
    const [g, h, i, j, k, l] = [_a, _b, _c, _d, _e, _f];
    (this.a = a * g + c * h);
    (this.c = a * i + c * j);
    (this.e = a * k + c * l + e);
    (this.b = b * g + d * h);
    (this.d = b * i + d * j);
    (this.f = b * k + d * l + f);
    return this;
  }

  /*
     | g i k |   | a c e |   | ga+ib gc+id ge+if+k |
     | h j l | * | b d f | = | ha+jb hc+jd he+jf+l |
     | 0 0 1 |   | 0 0 1 |   | 0     0     1       |
   */

  // prettier-ignore
  prepend(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): Matrix2D {
    const {a, b, c, d, e, f} = this;
    const [g, h, i, j, k, l] = [_a, _b, _c, _d, _e, _f];
    (this.a = g * a + i * b);
    (this.c = g * c + i * d);
    (this.e = g * e + i * f + k);
    (this.b = h * a + j * b);
    (this.d = h * c + j * d);
    (this.f = h * e + j * f + l);
    return this;
  }

  appendMatrix(mtx: Matrix2D): Matrix2D {
    return this.append(mtx.a, mtx.b, mtx.c, mtx.d, mtx.e, mtx.f);
  }

  prependMatrix(mtx: Matrix2D): Matrix2D {
    return this.prepend(mtx.a, mtx.b, mtx.c, mtx.d, mtx.e, mtx.f);
  }

  scale(sx: number, sy: number): Matrix2D {
    return this.prepend(sx, 0, 0, sy, 0, 0);
  }

  rotate(theta: number): Matrix2D {
    const cost = Math.cos(theta);
    const sint = Math.sin(theta);
    return this.prepend(cost, sint, -sint, cost, 0, 0);
  }

  translate(tx: number, ty: number): Matrix2D {
    return this.prepend(1, 0, 0, 1, tx, ty);
  }

  skew(sx: number, sy: number): Matrix2D {
    return this.prepend(1, sy, sx, 1, 0, 0);
  }

  cross(x: number, y: number): [number, number] {
    return [this.a * x + this.c * y + this.e, this.b * x + this.d * y + this.f];
  }

  identity() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }

  equals(other: Matrix2D): boolean {
    return (
      this.a === other.a &&
      this.b === other.b &&
      this.c === other.c &&
      this.d === other.d &&
      this.e === other.e &&
      this.f === other.f
    );
  }
}
