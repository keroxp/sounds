import {render} from "react-dom";
import * as React from "react";
import {FC, useEffect, useRef} from "react";
import {createRect, rectContainsPoint} from "./geom";
import {Matrix2D} from "./mtx";

function EditorRenderer({canvas}: {
  canvas: HTMLCanvasElement
}) {
  let mtx = new Matrix2D();
  let locatorMtx = new Matrix2D();
  let draggingLocator = false;
  const minZoom = 0.1;
  const maxZoom = 4;
  const onWheel = (wheel: WheelEvent) => {
    const d = wheel.deltaY / 200;
    const nsx = Math.min(Math.max(mtx.a + d, minZoom), maxZoom);
    const {x} = wheel;
    const ds = nsx / mtx.a;
    mtx.e = (mtx.e-x) * ds + x;
    mtx.a = nsx;
  };
  function screenToStage(ev: PointerEvent): [number, number] {
    const {left, top} = canvas.getBoundingClientRect();
    const inv = mtx.invert();
    return inv.cross(ev.x - left, ev.y- top);
  }
  const onPointer = (type: "down"|"move"|"up", ev: PointerEvent) => {
    if (type === "down") {
      const [x, y] = screenToStage(ev);
      const locatorBounds = createRect(
        locatorMtx.e - 10, 0, 20, canvas.height
      );
      console.log(locatorBounds, {x,y});
      if (rectContainsPoint(locatorBounds, {x,y})) {
        draggingLocator = true;
      }
    }
    if (type === "move") {
      if (draggingLocator) {
        locatorMtx.e += ev.movementX / mtx.a;
      } else {
        mtx.e += ev.movementX;

      }
    }
    if (type === "up") {
      draggingLocator = false;
    }
  };
  let shouldHandle = false;
  canvas.addEventListener("pointerdown", (ev) => {
    shouldHandle = true;
    onPointer("down", ev)
  });
  window.addEventListener("pointermove", ev => {
    if (shouldHandle) {
      ev.preventDefault();
      ev.stopPropagation();
      onPointer("move", ev)
    }
  });
  window.addEventListener("pointerup", ev => {
    if (shouldHandle) {
      ev.preventDefault();
      ev.stopPropagation();
      onPointer("up", ev);
      shouldHandle = false;
    }
  });
  canvas.addEventListener("wheel", onWheel);
  function render() {
    const sx = mtx.a;
    const tx = mtx.e;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.clearRect(0,0,canvas.width, canvas.height);
    {
      ctx.save();
      ctx.fillStyle = "#ccc";
      ctx.fillRect(0, 20, canvas.width, canvas.height - 40);
      ctx.transform(sx, 0, 0, 1, tx, 0);
      {
        ctx.translate(0, 20);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1 / sx;
        for (let i = 0; i < canvas.width; i += 100) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height - 40);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    {
      const locatorX = locatorMtx.prependMatrix(mtx).e;
      ctx.save();
      ctx.beginPath();
      ctx.transform(sx, 0, 0, 1, tx, 0);
      ctx.fillStyle = "red";
      ctx.strokeStyle = "red";
      {
        ctx.save();
        ctx.beginPath();
        ctx.arc(locatorX, 10, 10, 0,Math.PI*2,true);
        ctx.fill();
        ctx.restore();
      }
      {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(locatorX, 20);
        ctx.lineTo(locatorX, canvas.height - 20);
        ctx.stroke();
      }
      {
        ctx.beginPath();
        ctx.arc(locatorX, canvas.height-10, 10, 0,Math.PI*2,true);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}
const Editor: FC = () => {
  const w = window.innerWidth;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    EditorRenderer({canvas: ref.current!});
  }, []);
  const h = 200;
  return (
    <div style={{width: "100%", height: "100%"}}>
      <div>
        <canvas
          ref={ref}
          width={w} height={h} style={{
          width: w,
          height: h ,
        }} />
        <audio src={"/mp3/2019-09-18.mp3"} controls />
      </div>
    </div>
  )
};

render(<Editor />, document.getElementById("app"));
