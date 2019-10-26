import * as React from "react";
import { createRef } from "react";
import { Store } from "./oreducer";
import { fmtTime } from "./util";
import { LyricRange, ranges } from "./lyric-sync";
import { Syncer } from "./syncer";
import { RangeEditor } from "./range-editor";

export type PlayerState = {
  seek: {
    time: number;
    sync: boolean;
  };
  dragging: boolean;
  playing: boolean;
  volume: number;
  loading: boolean;
  duration?: number;
  range?: LyricRange;
  counterMode: boolean;
};

type TouchPointerEvent = PointerEvent | TouchEvent | MouseEvent;
const hasPointerEvent = !!window["PointerEvent"];

export class Player extends React.Component<{ store: Store }, PlayerState> {
  audioRef = createRef<HTMLAudioElement>();
  knobRef = createRef<HTMLDivElement>();
  sliderRef = createRef<HTMLDivElement>();
  syncer = new Syncer(ranges, range => {
    this.setState({ range });
  });

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
      duration: undefined,
      counterMode: false
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
    this.syncer.schedule();
  }

  componentDidUpdate(
    prevProps: Readonly<{ store: Store }>,
    prevState: Readonly<PlayerState>,
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
      if (!prevState.dragging && this.state.dragging) {
        this.syncer.stop();
      } else if (prevState.dragging && !this.state.dragging){
        this.syncer.sync(this.state.seek.time * 1000, false);
        this.syncer.schedule();
      }
      if (this.state.seek !== prevState.seek) {
        const audio = this.audioRef.current!;
        this.syncer.sync(this.state.seek.time * 1000, false);
        if (this.state.seek.sync) {
          audio.currentTime = this.state.seek.time;
        }
        const { width } = this.sliderRef.current!.getBoundingClientRect();
        const knobX = (this.state.seek.time / this.state.duration!) * width;
        this.knobRef.current!.style.transform = `translateX(${knobX}px)`;
      }
      if (this.state.playing !== prevState.playing) {
        if (this.state.playing) {
          this.audioRef.current!.play();
          this.syncer.schedule();
        } else {
          this.audioRef.current!.pause();
          this.syncer.stop();
        }
      }
    }
    if (this.state.volume !== prevState.volume) {
      this.audioRef.current!.volume = this.state.volume;
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
    const { left, width } = this.sliderRef.current!.getBoundingClientRect();
    let x = 0;
    ev.preventDefault();
    ev.stopPropagation();
    if (ev["touches"]) {
      x = (ev as TouchEvent).touches[0].pageX - left;
    } else {
      x = (ev as PointerEvent | MouseEvent).pageX - left;
    }
    const knobX = Math.max(Math.min(width, x), 0);
    this.knobRef.current!.style.transform = `translateX(${knobX}px)`;
    const time = this.state.duration! * (knobX / width);
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
    console.log("can play");
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
    if (!this.state.playing) return;
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
    const range = this.syncer.current();
    if (range) {
      console.log(range.text);
    }
    const buttonDisabled = this.state.duration === undefined;
    let width = 0;
    if (this.sliderRef.current) {
      width = this.sliderRef.current.getBoundingClientRect().width;
    }
    return (
      <div className="player">
        {/*{!this.state.loading && (*/}
        {/*  <div style={{position: "absolute", top: -60}}>*/}
        {/*    <RangeEditor*/}
        {/*      ranges={ranges}*/}
        {/*      duration={this.audioRef.current!.duration}*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*)}*/}
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
          {this.state.counterMode && (
            <div>

              <button>Turn Off</button>
            </div>
          )}
          {!this.state.counterMode && range && (
            <div className="playerLyrics">{range.text}</div>
          )}
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
