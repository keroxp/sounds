import * as React from "react";
import { FC, Reducer, useEffect, useReducer, useRef, useState } from "react";
import { Store } from "./oreducer";
import { sprintf } from "sprintf";

type State = {
  seek: {
    time: number;
    sync: boolean;
  };
  dragging: boolean;
  playing: boolean;
  volume: number;
  loading: boolean;
  duration?: number;
};
export const Player: FC<{ store: Store }> = ({ store }) => {
  const song = store.song!;
  const [state, dispatch] = useReducer<Reducer<State, Partial<State>>>(
    (prevState, action) => {
      return { ...prevState, ...action };
    },
    {
      seek: {
        time: 0,
        sync: true
      },
      dragging: false,
      playing: false,
      loading: true,
      volume: 1
    }
  );
  const knobRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    dispatch({
      seek: {
        time: 0,
        sync: true
      },
      playing: false,
      loading: true,
      duration: undefined
    });
  }, [store.song]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = audioRef.current!;
    if (state.seek.sync) {
      audio.currentTime = state.seek.time;
    }
    if (knobRef.current && !state.dragging) {
      const { width } = sliderRef.current!.getBoundingClientRect();
      knobRef.current.style.transform = `translateX(${(state.seek.time /
        state.duration!) *
        width}px)`;
    }
  }, [state.seek, state.dragging, knobRef.current]);
  useEffect(() => {
    const audio = audioRef.current!;
    if (state.playing) {
      audio.play();
    } else if (!state.playing) {
      audio.pause();
    }
  }, [state.playing]);
  useEffect(() => {
    audioRef.current!.volume = state.volume;
  }, [state.volume]);
  const onCanPlay = () => {
    dispatch({
      loading: false,
      playing: true
    });
  };
  const onLoadMetadata = (ev: React.SyntheticEvent) => {
    const tgt = ev.target as HTMLAudioElement;
    dispatch({
      duration: tgt.duration
    });
  };
  const onClickPlay = () => {
    dispatch({
      playing: !state.playing
    });
  };
  useEffect(() => {
    const knob = knobRef.current;
    const slider = sliderRef.current;
    if (!knob || !slider) return;
    let handling = false;
    let knobX = 0;
    const onDown = (ev: PointerEvent | MouseEvent | TouchEvent) => {
      handling = true;
      const { left, width } = slider.getBoundingClientRect();
      let x = 0;
      ev.preventDefault();
      ev.stopPropagation();
      if (ev["touches"]) {
        x = (ev as TouchEvent).touches[0].pageX - left;
      } else {
        x = (ev as PointerEvent | MouseEvent).pageX - left;
      }
      const r = x / width;
      knobX = x;
      knob.style.transform = `translateX(${knobX}px)`;
      dispatch({
        seek: {
          time: state.duration! * r,
          sync: false
        },
        dragging: true
      });
    };
    const onMove = (ev: PointerEvent | MouseEvent | TouchEvent) => {
      if (!handling) return;
      ev.preventDefault();
      ev.stopPropagation();
      const { left, width } = slider.getBoundingClientRect();
      let x = 0;
      if (ev["touches"]) {
        x = (ev as TouchEvent).touches[0].pageX - left;
      } else {
        x = (ev as (PointerEvent | MouseEvent)).pageX - left;
      }
      knobX = Math.max(Math.min(width, x), 0);
      knob.style.transform = `translateX(${knobX}px)`;
      dispatch({
        seek: {
          time: state.duration! * (knobX / width),
          sync: false
        }
      });
    };
    const onUp = (ev: PointerEvent | MouseEvent | TouchEvent) => {
      if (!handling) return;
      ev.preventDefault();
      ev.stopPropagation();
      handling = false;
      const { width } = slider.getBoundingClientRect();
      dispatch({
        seek: {
          time: state.duration! * (knobX / width),
          sync: true
        },
        dragging: false
      });
    };
    const hasPointerEvent = !!window["PointerEvent"];
    const downEv = hasPointerEvent ? "pointerdown" : "touchstart";
    const moveEv = hasPointerEvent ? "pointermove" : "touchmove";
    const upEv = hasPointerEvent ? "pointerup" : "touchend";
    const moveTgt = hasPointerEvent ? window : knob;
    knob.addEventListener(downEv, onDown);
    slider.addEventListener(downEv, onDown);
    moveTgt.addEventListener(moveEv, onMove);
    moveTgt.addEventListener(upEv, onUp);
    return () => {
      moveTgt.removeEventListener(moveEv, onMove);
      moveTgt.removeEventListener(upEv, onUp);
    };
  }, [knobRef.current, sliderRef.current]);
  const onTimeUpdate = (ev: React.SyntheticEvent) => {
    const tgt = ev.target as HTMLAudioElement;
    dispatch({
      seek: {
        time: tgt.currentTime,
        sync: false
      }
    });
  };
  const buttonDisabled = state.duration === undefined;
  return (
    <div className="player">
      <audio
        src={song.audioSrc}
        ref={audioRef}
        onCanPlay={onCanPlay}
        onLoadedMetadata={onLoadMetadata}
        onTimeUpdate={onTimeUpdate}
        style={{ display: "hidden" }}
      />
      <div className="playerInner">
        <div className="playerThumb">
          <img src={song.thumbSrc} />
        </div>
        <button className="playerButton" disabled={buttonDisabled}>
          <i className="material-icons md-18">skip_previous</i>
        </button>
        <button
          className="playerButton"
          onClick={onClickPlay}
          disabled={buttonDisabled}
        >
          {!state.playing && <i className="material-icons md-18">play_arrow</i>}
          {state.playing && <i className="material-icons md-18">pause</i>}
        </button>
        <button className="playerButton" disabled={buttonDisabled}>
          <i className="material-icons md-18">skip_next</i>
        </button>
        <button className="playerButton" disabled={buttonDisabled}>
          <i className="material-icons md-18">volume_up</i>
        </button>
        <div>{song.title}</div>
        {/*<RangeCounter state={state}/>*/}
        <LyricSync state={state} />
      </div>
      <div className="playerInner">
        <div className="playerCurrentTime">{fmtTime(state.seek.time)}</div>
        <div className="playerSlider playerItem">
          <div className="playerSliderInner" ref={sliderRef}>
            <div className="playerSliderBack" />
            {state.duration && (
              <div
                className="playerSliderFront"
                style={{
                  transform: `scaleX(${100 *
                    (state.seek.time / state.duration)})`
                }}
              />
            )}
          </div>
          {state.duration && <div className="playerSliderKnob" ref={knobRef} />}
        </div>
        <div className="playerRemainingTime">
          -{fmtTime((state.duration || 0) - state.seek.time)}
        </div>
      </div>
    </div>
  );
};
let startTime = new Date().getTime();
const RangeCounter: FC<{ state: State }> = ({ state }) => {
  const [rangeStart, setRangeStart] = useState<number>(0);
  useEffect(() => {
    if (state.playing) {
      startTime = Date.now();
    }
  }, [state.playing]);
  const [ranges, setRanges] = useState<[number, number][]>([]);
  return (
    <div>
      <button
        onClick={() => {
          const delta = Date.now() - startTime;
          setRanges([...ranges, [rangeStart, delta]]);
          setRangeStart(delta);
        }}
      >
        start
      </button>
      <button
        disabled={!rangeStart}
        onClick={() => {
          const delta = Date.now() - startTime;
          setRanges([...ranges, [rangeStart!, delta]]);
          setRangeStart(delta);
        }}
      >
        end
      </button>
      <button
        onClick={() => {
          console.log(
            ranges
              .map(([s, e]) => {
                return `[${fmtms(s)}-${fmtms(e)}]`;
              })
              .join("\n")
          );
        }}
      >
        print
      </button>
      <span>
        {ranges
          .map(([s, e]) => {
            return `[${fmtms(s)}-${fmtms(e)}]`;
          })
          .join(",")}
      </span>
    </div>
  );
};

export function fmtTime(sec: number): string {
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return sprintf("%02d:%02d", m, s);
}

export function fmtms(ms: number): string {
  const m = Math.floor(ms / (1000 * 60));
  const s = Math.floor((ms - m * 1000 * 60) / 1000);
  const res = ms - (m * 1000 * 60 + s * 1000);
  return sprintf("%02d:%02d:%03d", m, s, res);
}

type LyricRange = {
  start: number;
  end: number;
  text: string;
};

const reg = /^\[(.+?)-(.+?)\](.+?)$/;
const timeReg = /(\d{2}):(\d{2}):(\d{3})/;
const ranges = `
[00:00:000-00:09:916]〜前奏〜
[00:09:916-00:15:882]瞬いていたその一瞬で変わる世界に置いていかれた
[00:15:882-00:21:917]振り向く暇もうなずく暇も見つけられずに過ごしてきた
[00:21:917-00:27:956]〜間奏〜
[00:27:956-00:33:815]見慣れた顔が映る鏡のひび割れにすら気づけなくて
[00:33:815-00:39:951]繰り返すようにつぶやいている変わるべきかありのままか
[00:39:951-00:45:926]〜間奏〜
[00:45:926-00:58:048]這って進んでも遠ざかるばかり 走って転んで悔しがっている
[00:58:048-01:15:065]届けって叫び続けても 届かない砂漠の陽炎のように
[01:15:065-01:22:408]戸惑いもつまづいた石も全部僕らを導くから
[01:22:408-01:26:418]転がった先の道しるべに
[01:26:418-01:39:839]思い出になった日も古めかしい手紙も夜の中で光り続けている
[01:39:839-01:45:827]羽ばたいていたその一瞬で回る世界においていかれた
[01:45:827-01:51:915]飛び立つ先も留まる場所も与えられずに生まれてきた
[01:51:915-01:57:929]〜間奏〜
[01:57:929-02:03:863]憂いを持てば青い空さえ深い海の底にみえて
[02:03:863-02:10:018]繰り返すように問いかけている釣り合うのは夢と何か
[02:10:018-02:16:035]〜間奏〜
[02:16:035-02:27:990]なんでどうしてって比べ続けてる 勝って負けて何が得られんだ
[02:27:990-02:45:405]求めて歩き続けても戻れない 極夜の只中のように
[02:45:405-02:52:289]面影もふらついた足も全部僕らを導くから
[02:52:289-02:56:260]凍りついた季節の終わりに
[02:56:260-03:08:451]止まってた時計も通り過ぎた景色も春の中で動き始めている
[03:08:451-03:24:039]〜間奏〜
[03:24:039-03:31:318]戸惑いもつまづいた石も全部僕らを導くから 
[03:31:318-03:35:253]転がった先の道しるべに
[03:35:253-03:49:503]思い出になった日も古めかしい手紙も夜の中で光り続けている
 `
  .split("\n")
  .filter(v => v.match(reg))
  .map(
    (v): LyricRange => {
      const [_, s, e, str] = v.match(reg)!;
      const conv = (pat: string) => {
        const [_, min, sec, ms] = pat.match(timeReg)!;
        return parseInt(min) * 1000 * 60 + parseInt(sec) * 1000 + parseInt(ms);
      };
      return {
        start: conv(s),
        end: conv(e),
        text: str
      };
    }
  );
function getRangeInRange(ms: number): LyricRange | undefined {
  return ranges.filter(v => v.start <= ms && ms < v.end)[0];
}
const LyricSync: FC<{ state: State }> = ({ state }) => {
  // const [range, setRange] = useState<LyricRange|undefined>();
  const [timer, setTimer] = useState<any|undefined>();
  const [range, setRange] = useState<LyricRange|undefined>();
  useEffect(() => {
    const seekTimeMs = state.seek.time*1000;
    const nextRange = getRangeInRange(seekTimeMs+1000);
    if (state.seek.sync) {
      clearTimeout(timer);
    }
    if (nextRange && nextRange !== range) {
      if (timer) {
        clearTimeout(timer)
      }
      const t = setTimeout(() => {
        setRange(nextRange);
        setTimer(undefined);
      }, nextRange.start - seekTimeMs);
      setTimer(t);
    }
  }, [state.seek.time]);
  if (!range) return null;
  return <div className="playerLyrics">{range.text}</div>;
};
