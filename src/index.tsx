import * as React from "react";
import {  FC, useEffect, useState } from "react";
import { render } from "react-dom";
import { AppFC, createStore, Store } from "./oreducer";
import {Player} from "./player";

export const Header: FC = () => {
  return (
    <div className="header">
      <h1>keroxp's sounds</h1>
      <div>
        <a href={"https://twitter.com/keroxp"} target={"_blank"}>@keroxp</a>
        が作った曲置き場 | ©keroxp
      </div>
    </div>
  );
};
export type Song = {
  title: string;
  thumbSrc?: string;
  description: string;
  published: string;
  lyricSrc: string;
  audioSrc: string;
};

const SongCell: AppFC<{
  isNew: boolean;
  song: Song;
}> = ({ song,isNew, store }) => {
  const onClick = () => {
    store.reduce(() => ({ song }));
  };
  return (
    <div className="songCell" onClick={onClick} data-selected={store.song===song}>
      <div className="songCellBody">
        <div style={{ backgroundColor: "#ccc" }}>
          {song.thumbSrc && <img className="songThumb" src={song.thumbSrc} />}
        </div>
        <div className="songCellDesc">
          <div className="songTitle">
            {isNew && <span className="newSong">New! </span>}
            {song.title}
          </div>
          <div>{song.published}</div>
        </div>
      </div>
    </div>
  );
};
const Lyrics: AppFC = ({ store }) => {
  const { song } = store;
  if (!song) return null;
  const [text, setText] = useState<string | undefined>(undefined);
  const loading = !text;
  useEffect(() => {
    fetch(encodeURI(song.lyricSrc))
      .then(async resp => {
        setText(await resp.text());
      })
      .catch(console.error);
  }, [song.title]);
  return (
    <div className="lyrics">
      {loading && <div>Loading...</div>}
      {!loading && (
        <div className="lyricsBody">
          <div className="lyricsTitle">
            {song.title}
          </div>
          <div className="lyricsCredits">
            <div>公開日: {song.published}</div>
            <div>作詞・作曲・編曲: keroxp</div>
            <div>歌: 初音ミク</div>
          </div>
          <div className="lyricsLyrics">
            {text!.split("\n").map((v,i) => {
              if (v) {
                return <div className="lyricParagraph" key={i}>{v}</div>
              } else {
                return <br key={i} />
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};
const songs: Song[] = [
  {
    title: "Polar nights",
    description: "あ",
    published: "2019/09/18",
    lyricSrc: "/lyrics/2019-09-18.txt",
    audioSrc: "/mp3/2019-09-18.mp3"
  },
  {
    title: "どうしたのって聞かれても",
    description: "あ",
    published: "2019/08/12",
    thumbSrc: "/img/03.png",
    lyricSrc: "/lyrics/2019-08-12.txt",
    audioSrc: "/mp3/2019-08-12.mp3"
  },
  {
    title: "Hurry up!",
    description: "あ",
    published: "2019/07/13",
    thumbSrc: "/img/02.png",
    lyricSrc: "/lyrics/2019-07-13.txt",
    audioSrc: "/mp3/2019-07-13.mp3"
  },
  {
    title: "空っぽの歌",
    description: "あ",
    published: "2019/07/01",
    thumbSrc: "/img/01.png",
    lyricSrc: "/lyrics/2019-07-01.txt",
    audioSrc: "/mp3/2019-07-01.mp3"
  }
];

export const Body: AppFC = ({ store }) => {
  return (
    <div className="body">
      <div className="playlist">
        {songs.map((song,i) => (
          <SongCell key={song.title}
                    store={store}
                    isNew={i===0}
                    song={song} />
        ))}
      </div>
      <Lyrics store={store} />
    </div>
  );
};

export const Index: FC = () => {
  let [state, setState] = useState<Store>(() => {
    const ret = createStore();
    ret.subscribe(v => setState(v));
    return ret;
  });
  return (
    <div className="content">
      <Header />
      <Body store={state} />
      {state.song &&  <Player store={state} />}
    </div>
  );
};

render(<Index />, document.getElementById("app"));
