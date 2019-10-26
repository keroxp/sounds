import * as React from "react";
import { createRef, FC, useEffect, useState } from "react";
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

type TouchPointerEvent = PointerEvent | TouchEvent | MouseEvent;
const hasPointerEvent = !!window["PointerEvent"];
export class Player extends React.Component<{ store: Store }, State> {
  audioRef = createRef<HTMLAudioElement>();
  knobRef = createRef<HTMLDivElement>();
  sliderRef = createRef<HTMLDivElement>();
  constructor(props) {
    super(props);
    this.state = {
      seek: {
        time: 0,
        sync: false
      },
      dragging: false,
      playing: false,
      loading: true,
      volume: 0,
      duration: undefined
    };
  }
  bind() {
    const knob = this.knobRef.current;
    const slider = this.sliderRef.current;
    if (!knob || !slider) return;
    const [downEv, moveEv, upEv] = this.targetEvents();
    const moveTgt = hasPointerEvent ? window : knob;
    knob.addEventListener(downEv, this.onDown);
    slider.addEventListener(downEv, this.onDown);
    moveTgt.addEventListener(moveEv, this.onMove);
    moveTgt.addEventListener(upEv, this.onUp);
  }
  unbind() {
    const moveTgt = hasPointerEvent ? window : this.knobRef.current!;
    const [_, moveEv, upEv] = this.targetEvents();
    moveTgt.removeEventListener(moveEv, this.onMove);
    moveTgt.removeEventListener(upEv, this.onUp);
  }
  componentDidMount(): void {
    this.bind();
  }

  componentDidUpdate(
    prevProps: Readonly<{ store: Store }>,
    prevState: Readonly<State>,
    snapshot?: any
  ): void {
    if (prevProps.store.song != this.props.store.song) {
      this.unbind();
      this.bind();
      this.setState({
        seek: {
          time: 0,
          sync: true
        },
        playing: false,
        loading: true,
        dragging: false,
        duration: undefined
      });
    }
    if (!this.state.loading) {
      if (this.state.playing !== prevState.playing) {
        if (this.state.playing) {
          this.audioRef.current!.play();
        } else {
          this.audioRef.current!.pause();
        }
      }
      if (this.state.seek !== prevState.seek) {
        const audio = this.audioRef.current!;
        if (this.state.seek.sync) {
          audio.currentTime = this.state.seek.time;
        }
        const { width } = this.sliderRef.current!.getBoundingClientRect();
        const knobX = (this.state.seek.time / this.state.duration!) * width;
        this.knobRef.current!.style.transform = `translateX(${knobX}px)`;
      }
    }
    if (this.state.volume !== prevState.volume) {
      this.audioRef.current!.volume = 0//this.state.volume;
    }
  }

  componentWillUnmount(): void {
    this.unbind();
  }

  targetEvents(): [string, string, string] {
    const downEv = hasPointerEvent ? "pointerdown" : "touchstart";
    const moveEv = hasPointerEvent ? "pointermove" : "touchmove";
    const upEv = hasPointerEvent ? "pointerup" : "touchend";
    return [downEv, moveEv, upEv];
  }

  onDown = (ev: TouchPointerEvent) => {
    console.log("down");
    const { left, width } = this.sliderRef.current!.getBoundingClientRect();
    let x = 0;
    ev.preventDefault();
    ev.stopPropagation();
    if (ev["touches"]) {
      x = (ev as TouchEvent).touches[0].pageX - left;
    } else {
      x = (ev as PointerEvent | MouseEvent).pageX - left;
    }
    const r = x / width;
    // this.knobRef.current!.style.transform = `translateX(${x}px)`;
    const time = this.state.duration! * r;
    this.setState({
      seek: {
        time,
        sync: false
      },
      playing: false,
      dragging: true
    });
  };
  onMove = (ev: TouchPointerEvent) => {
    if (!this.state.dragging) return;
    ev.preventDefault();
    ev.stopPropagation();
    const { left, width } = this.sliderRef.current!.getBoundingClientRect();
    let x = 0;
    if (ev["touches"]) {
      x = (ev as TouchEvent).touches[0].pageX - left;
    } else {
      x = (ev as (PointerEvent | MouseEvent)).pageX - left;
    }
    const knobX = Math.max(Math.min(width, x), 0);
    this.knobRef.current!.style.transform = `translateX(${knobX}px)`;
    const time = this.state.duration! * (knobX / width);
    this.setState({
      seek: {
        time,
        sync: false
      }
    });
  };
  onUp = (ev: TouchPointerEvent) => {
    if (!this.state.dragging) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.setState({
      seek: {
        time: this.state.seek.time,
        sync: true
      },
      playing: true,
      dragging: false
    });
  };
  onCanPlay = () => {
    this.setState({
      loading: false,
      playing: true
    });
  };
  onLoadMetadata = (ev: React.SyntheticEvent) => {
    const tgt = ev.target as HTMLAudioElement;
    this.setState({
      duration: tgt.duration
    });
  };
  onClickPlay = () => {
    this.setState({
      playing: !this.state.playing
    });
  };
  onTimeUpdate = (ev: React.SyntheticEvent) => {
    const tgt = ev.target as HTMLAudioElement;
    this.setState({
      seek: {
        time: tgt.currentTime,
        sync: false
      }
    });
  };
  render() {
    let { store } = this.props;
    const song = store.song!;
    const buttonDisabled = this.state.duration === undefined;
    let width = 0;
    if (this.sliderRef.current) {
      width = this.sliderRef.current.getBoundingClientRect().width;
    }
    return (
      <div className="player">
        <audio
          src={song.audioSrc}
          ref={this.audioRef}
          onCanPlay={this.onCanPlay}
          onLoadedMetadata={this.onLoadMetadata}
          onTimeUpdate={this.onTimeUpdate}
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
            onClick={this.onClickPlay}
            disabled={buttonDisabled}
          >
            {!this.state.playing && (
              <i className="material-icons md-18">play_arrow</i>
            )}
            {this.state.playing && (
              <i className="material-icons md-18">pause</i>
            )}
          </button>
          <button className="playerButton" disabled={buttonDisabled}>
            <i className="material-icons md-18">skip_next</i>
          </button>
          <button className="playerButton" disabled={buttonDisabled}>
            <i className="material-icons md-18">volume_up</i>
          </button>
          <div>{song.title}</div>
          {/*<RangeCounter state={state}/>*/}
          <LyricSync state={this.state} />
        </div>
        <div className="playerInner">
          <div className="playerCurrentTime">
            {fmtTime(this.state.seek.time)}
          </div>
          <div className="playerSlider playerItem">
            <div className="playerSliderInner" ref={this.sliderRef}>
              <div className="playerSliderBack">
                {this.state.duration && (
                  <div
                    className="playerSliderFront"
                    style={{
                      width:
                        (this.state.seek.time / this.state.duration) * width
                    }}
                  />
                )}
              </div>
            </div>
            <div className="playerSliderKnob" ref={this.knobRef} />
          </div>
          <div className="playerRemainingTime">
            -{fmtTime((this.state.duration || 0) - this.state.seek.time)}
          </div>
        </div>
      </div>
    );
  }
}

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

class LyricSync extends React.Component<{ state: State }, { cnt: number }> {
  syncer: Syncer;

  constructor(props) {
    super(props);
    this.state = {
      cnt: 0
    };
    this.syncer = new Syncer(ranges, range => {
      this.setState({ cnt: this.state.cnt + 1 });
    });
  }

  componentDidMount(): void {
    this.syncer.schedule();
  }

  componentDidUpdate(
    prevProps: Readonly<{ state: State }>,
    prevState: Readonly<{ cnt: number }>,
    snapshot?: any
  ): void {
    const { seek } = this.props.state;
    this.syncer.sync(seek.time * 1000, false);
    if (this.props.state.playing) {
      this.syncer.schedule();
    } else {
      this.syncer.stop();
    }
  }

  render() {
    const range = this.syncer.current();
    if (!range) {
      return null;
    }
    return <div className="playerLyrics">{range.text}</div>;
  }
}

class Syncer {
  constructor(
    readonly ranges: LyricRange[],
    readonly onChange: (range: LyricRange | undefined) => void
  ) {}

  private getRangeInRange(ms: number): LyricRange | undefined {
    return this.ranges.find(v => v.start <= ms && ms < v.end);
  }

  private seekTime: number = 0;
  private prevTime: number = performance.now();
  private syncTimer: any | undefined;
  scheduling = false;
  private _current: LyricRange | undefined;

  update() {
    const now = performance.now();
    const nextSeek = this.seekTime + (now - this.prevTime);
    this.sync(nextSeek, true);
    this.prevTime = now;
  }

  sync(seek: number, fromUpdate: boolean) {
    const nextRange = this.getRangeInRange(seek);
    if (nextRange && !this.current) {
      this._current = nextRange;
    }
    if (nextRange && nextRange !== this._current) {
      if (!fromUpdate) {
        this._current = nextRange;
      } else {
        clearTimeout(this.syncTimer);
        this.syncTimer = setTimeout(() => {
          this.seekTime = nextRange.start;
          this.syncTimer = undefined;
          this.onChange((this._current = nextRange));
        }, nextRange.start - this.seekTime);
      }
    }
    this.seekTime = seek;
  }

  private scheduleTimer: any | undefined;

  current(): LyricRange | undefined {
    return this._current;
  }

  schedule() {
    if (this.scheduling) return;
    this.scheduling = true;
    this.scheduleTimer = setInterval(() => {
      this.update();
    }, 100);
  }

  stop() {
    this.scheduling = false;
    clearInterval(this.scheduleTimer);
    clearTimeout(this.syncTimer);
    this.syncTimer = undefined;
    this.scheduleTimer = undefined;
  }
}
