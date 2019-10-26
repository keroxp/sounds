import {sprintf} from "sprintf";

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