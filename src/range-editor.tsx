import * as React from "react";
import { FC, useEffect, useRef } from "react";
import { LyricRange } from "./lyric-sync";
import { createRect, rectContainsPoint } from "./geom";
import { renderToNodeStream } from "react-dom/server";
import {Matrix2D} from "./mtx";

export const RangeEditor: FC<{
  duration: number;
  ranges: LyricRange[];
}> = ({ duration, ranges }) => {
  const w = window.innerWidth;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const rend = rangeEditorRenderer({
      canvas: ref.current!,
      duration,
      ranges
    });
    rend.schedule();
  }, []);
  return (
    <div style={{ width: w, height: 60 }}>
      <canvas
        ref={ref}
        width={w}
        height={60}
        style={{
          cursor: "default"
        }}
      />
    </div>
  );
};

interface RangeEditorRenderer {
  schedule();
  stop();
}
interface RangeTrimmer {
  addDelta(x: number);
}

function rangeEditorRenderer({
  canvas,
  duration,
  ranges
}: {
  canvas: HTMLCanvasElement;
  duration: number;
  ranges: LyricRange[];
}): RangeEditorRenderer {
  let scheduling = false;
  let shouldHandle = false;
  let needsRedraw = true;
  const minZoom = 0.1;
  const maxZoom = 4;
  let _;
  let mtx = new Matrix2D();
  let trimmer: RangeTrimmer|undefined;
  function onPointer(type: "down" | "move" | "up", ev: PointerEvent) {
    if (type === "down") {
      [_, trimmer] = getCursor(ev);
    } else if (type === "move") {
      if (trimmer) {
        trimmer.addDelta(ev.movementX / mtx.a);
      } else {
        mtx.e += ev.movementX / mtx.a;
      }
      needsRedraw = true;
    } else if (type === "up") {
      trimmer = undefined;
      needsRedraw = true;
    }
  }
  type TrimmingType = "start" | "end" | "end-start";
  function rangeTrimmer(
    type: TrimmingType,
    rangeIndex: number,
  ): RangeTrimmer {
    function addDelta(dx: number) {
      const dt = (dx / canvas.width) * duration * 1000;
      const range = ranges[rangeIndex];
      if (type === "start") {
        const prevEnd = rangeIndex > 0 ? ranges[rangeIndex-1].end : 0;
        range.start = Math.min(
          range.end,
          Math.max(prevEnd, range.start + dt)
        );
      } else if (type === "end") {
        const nextStart = rangeIndex < ranges.length-1 ? ranges[rangeIndex+1].start : duration*1000;
        range.end = Math.max(range.start, Math.min(nextStart, range.end + dt));
      } else {
        const next = ranges[rangeIndex+1];
        range.end = Math.max(range.start, Math.min(next.end, range.end + dt));
        next.start = Math.min(next.end, Math.max(range.start, next.start + dt));
      }
    }
    return { addDelta };
  }
  function screenToCanvas(ev: PointerEvent): [number, number] {
    const { left, top } = canvas.getBoundingClientRect();
    return mtx.invert().cross(ev.x - left, ev.y - top)
  }
  function getCursor(ev: PointerEvent): [string, RangeTrimmer | undefined] {
    const hitWidth = 5;
    const [x] = screenToCanvas(ev);
    let cursor = "default";
    function rangeToLR(range: LyricRange): [number, number] {
      const left = (range.start / (duration * 1000)) * canvas.width;
      const right = (range.end / (duration * 1000)) * canvas.width;
      return [left, right];
    }
    // [30][10][30]
    let rangeIndex: number = -1;
    let type: TrimmingType | undefined;
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const [left, right] = rangeToLR(range);
      const w = right - left;
      const w2 = Math.min(hitWidth * 5, w / 2);
      const [wLeft, wRight, eLeft, eRight] = [
        left + hitWidth,
        left + w2,
        right - w2,
        right - hitWidth
      ];
      if (wLeft <= x && x < wRight) {
        cursor = "e-resize";
        // ->
        type = "start";
        rangeIndex = i;
      } else if (eLeft <= x && x < eRight) {
        cursor = "w-resize";
        rangeIndex = i;
        // <-
        type = "end";
      }
      if (i < ranges.length - 1) {
        const next = ranges[i];
        if (
          next.start - range.end < 10 &&
          right - hitWidth <= x &&
          x < right + hitWidth
        ) {
          // <->
          cursor = "ew-resize";
          rangeIndex = i;
          type = "end-start";
        }
      }
      if (rangeIndex > -1) {
        break;
      }
    }
    if (type) {
      return [cursor, rangeTrimmer(type, rangeIndex)];
    }
    return [cursor, undefined];
  }
  function onWheel(ev: WheelEvent) {
    const d = ev.deltaY / 1000;
    const nsx = Math.min(Math.max(mtx.a + d, minZoom), maxZoom);
    const {x} = ev;
    const ds = nsx / mtx.a;
    mtx.e = (mtx.e-x) * ds + x;
    mtx.f = (mtx.f-canvas.height/2) *ds + canvas.height/2;
    mtx.d = mtx.a = nsx;
    needsRedraw = true;
  }
  function onFreeMove(ev: PointerEvent) {
    if (trimmer) return;
    const [cursor] = getCursor(ev);
    canvas.style.cursor = cursor;
  }
  canvas.addEventListener("wheel", onWheel);
  canvas.addEventListener("pointerdown", ev => {
    shouldHandle = true;
    onPointer("down", ev);
  });
  canvas.addEventListener("pointermove", ev => {
    onFreeMove(ev);
  });
  window.addEventListener("pointermove", ev => {
    if (shouldHandle) {
      onPointer("move", ev);
    }
  });
  window.addEventListener("pointerup", ev => {
    if (shouldHandle) {
      onPointer("up", ev);
      shouldHandle = false;
    }
  });
  function render() {
    if (!scheduling) return;
    if (!needsRedraw) {
      requestAnimationFrame(render);
      return;
    }
    needsRedraw = false;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#2E2E2E";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.transform(mtx.a,0,0,mtx.d,mtx.e,0);
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const left = (range.start / (duration * 1000)) * canvas.width;
      const right = (range.end / (duration * 1000)) * canvas.width;
      ctx.fillStyle = "#1E7D2E";
      ctx.fillRect(left, 0, right - left, canvas.height);
      {
        ctx.save();
        ctx.fillStyle = "#fff";
        ctx.font = "22px Arial";
        ctx.rect(left, 0, right - left, canvas.height);
        ctx.clip();
        ctx.fillText(range.text, left + 10, canvas.height / 2);
        ctx.restore();
      }
      ctx.strokeStyle = "black";
      ctx.strokeRect(left, 0, right - left, canvas.height);
    }
    ctx.restore();
    requestAnimationFrame(render);
  }
  function schedule() {
    scheduling = true;
    requestAnimationFrame(render);
  }
  function stop() {
    scheduling = false;
  }
  return { schedule, stop };
}
