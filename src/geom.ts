import { isNullOrUndefined, isNumber } from "util";

export type Point = {
  x: number;
  y: number;
};

export function isPoint(a): a is Point {
  return typeof a === "object" && typeof a.x === "number" && typeof a.y === "number"
}

export function createPoint(xOrPoint?: number | Point, y: number = 0): Point {
  if (isNullOrUndefined(xOrPoint)) return { x: 0, y: 0 };
  if (isNumber(xOrPoint)) {
    return { x: xOrPoint, y };
  } else {
    return { x: xOrPoint.x, y: xOrPoint.y };
  }
}

// export function calcMagnitude(p1: Point, p2: Point) {
//   return Vector.New({ x: p1.x - p2.x, y: p1.y - p2.y }).magnitude();
// }
//
// export function calcSqrMagnitude(p1: Point, p2: Point) {
//   return Vector.New({ x: p1.x - p2.x, y: p1.y - p2.y }).sqrMagnitude();
// }
//
// export function difference(p1: Point, p2: Point): Vector {
//   return new Vector(p1.x - p2.x, p1.y - p2.y);
// }

export type Size = {
  width: number;
  height: number;
};

export function isSize(a): a is Size {
  return typeof a === "object" && typeof a.width === "number" && typeof a.height === "number"
}

export function createSize(
  widthOrSize?: number | Size,
  height: number = 0
): Size {
  if (isNullOrUndefined(widthOrSize)) return { width: 0, height: 0 };
  if (isNumber(widthOrSize)) {
    return { width: widthOrSize, height: height };
  } else {
    return { width: widthOrSize.width, height: widthOrSize.height };
  }
}

export type Rect = Point & Size;

export function createRect(
  xOrRect: number | Rect = 0,
  y = 0,
  width = 0,
  height = 0
) {
  if (typeof xOrRect === "number") {
    return { x: xOrRect, y, width, height };
  } else {
    return {
      x: xOrRect.x,
      y: xOrRect.y,
      width: xOrRect.width,
      height: xOrRect.height
    };
  }
}

export function rectContainsPoint(self: Rect, tgt: Point) {
  const [right, bottom] = [self.x + self.width, self.y + self.height];
  return (
    self.x <= tgt.x && tgt.x <= right && self.y <= tgt.y && tgt.y <= bottom
  );
}

// export function rectApplyMatrix(self: Rect, mtx: DOMMatrix): Rect {
//   const { x, y, width, height } = self;
//   const [_x, _y] = mtx.cross(x, y);
//   const [_w, _h] = [width * mtx.a, height * mtx.d];
//   return createRect(_x, _y, _w, _h);
// }

export function rectEquals(a: Rect, b: Rect) {
  return (
    a &&
    b &&
    a.x === b.x &&
    b.y === a.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

export function sizeSqrArea(rect: Size): number {
  return Math.sqrt(rect.width * rect.height);
}

export function sizeEquals(a: Size, b: Size): boolean {
  return a.width === b.width && a.height === b.height;
}

export function sizeArea(rect: Size): number {
  return rect.width * rect.height;
}

export function rectScale(rect: Rect, sx: number, sy: number = sx): Rect {
  const r = createRect(rect);
  r.x *= sx;
  r.y *= sy;
  r.width *= sx;
  r.height *= sy;
  return r;
}

export function rectCenter(rect: Rect): [number, number] {
  return [rect.x + rect.width / 2, rect.y + rect.height / 2];
}

export function sizeScale(size: Size, s: number): Size {
  const ret = createSize(size);
  ret.width *= s;
  ret.height *= s;
  return ret;
}

export function rectContainsRect(self: Rect, tgt: Rect) {
  return (
    self.x <= tgt.x &&
    tgt.x + tgt.width <= self.x + self.width &&
    self.y <= tgt.y &&
    tgt.y + tgt.height <= self.y + self.height
  );
}

export function rectIntersectRect(self: Rect, tgt: Rect) {
  const [c1x, c1y] = rectCenter(self);
  const [c2x, c2y] = rectCenter(tgt);
  return (
    Math.abs(c1x - c2x) <= self.width / 2 + tgt.width / 2 &&
    Math.abs(c1y - c2y) <= self.height / 2 + tgt.height / 2
  );
}

export function extendRect(self: Rect, other: Rect) {
  let [left, top, right, bottom] = [
    self.x,
    self.y,
    self.x + self.width,
    self.y + self.height
  ];
  if (other.x < left) {
    left = other.x;
  }
  if (right < other.x + other.width) {
    right = other.x + other.width;
  }
  if (other.y < top) {
    top = other.y;
  }
  if (bottom < other.y + other.height) {
    bottom = other.y + other.height;
  }
  self.x = left;
  self.y = top;
  self.width = right - left;
  self.height = bottom - top;
  return self;
}

export function relativeRect({
                               rect,
                               withNormalizedRect
                             }: {
  rect: Rect;
  withNormalizedRect: Rect;
}): Rect {
  const newX = rect.x + rect.width * withNormalizedRect.x;
  const newY = rect.y + rect.height * withNormalizedRect.y;
  let newWidth = rect.width * withNormalizedRect.width;
  let newHeight = rect.height * withNormalizedRect.height;
  return createRect(newX, newY, newWidth, newHeight);
}

export function normalizeRect({
                                rect,
                                inSize
                              }: {
  rect: Rect;
  inSize: Size;
}): Rect {
  const x = rect.x / inSize.width;
  const y = rect.y / inSize.height;
  const width = rect.width / inSize.width;
  const height = rect.height / inSize.height;
  return createRect(x, y, width, height);
}

export type EdgeInsets = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function createEdgeInsets(
  left = 0,
  top = 0,
  right = 0,
  bottom = 0
): EdgeInsets {
  return { left, top, right, bottom };
}

export function scaleEdgeInsets(insets: EdgeInsets, s: number): EdgeInsets {
  return createEdgeInsets(
    insets.left * s,
    insets.top * s,
    insets.right * s,
    insets.bottom * s
  );
}
