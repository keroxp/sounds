import {FC, default as React, useEffect, useState} from "react";
import {fmtms} from "./util";
import {PlayerState} from "./player";

let startTime = new Date().getTime();
const RangeCounter: FC<{ state: PlayerState }> = ({state}) => {
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
