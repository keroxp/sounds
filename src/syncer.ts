import { LyricRange } from "./lyric-sync";

export class Syncer {
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
        console.log("sync",seek, nextRange.text)
      } else {
        clearTimeout(this.syncTimer);
        this.syncTimer = setTimeout(() => {
          this.seekTime = nextRange.start;
          this.syncTimer = undefined;
          console.log("onChange", nextRange.text);
          this.onChange((this._current = nextRange));
        }, nextRange.start - seek);
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
    }, 16);
  }

  stop() {
    this.scheduling = false;
    clearInterval(this.scheduleTimer);
    clearTimeout(this.syncTimer);
    this.syncTimer = undefined;
    this.scheduleTimer = undefined;
  }
}
