import {Song} from "./index";
import {FC} from "react";

export type AppProps = {
  song?: Song
}
export type Oreducer = (part: AppProps) => Partial<AppProps>
export type Store = Dispatcher & Readonly<AppProps>
export type Subscriber = (value: Store) => unknown;
export type Dispatcher = {
  reduce(reducer: Oreducer): void
  subscribe(handler: Subscriber): number
}
export type AppFC<T = {}> = FC<{store: Store} & T>
export function createStore(base: Partial<AppProps>= {}): Store {
  let store: Store = {
    reduce,
    subscribe,
    song: undefined,
    ...base
  };
  function reduce(reducer: Oreducer) {
    const next = {...store, ...reducer(store)};
    for (const sub of subscribers.values()) {
      sub(next);
    }
    store = next;
  }
  const subscribers = new Map<number, Subscriber>();
  let subscriberId = 0;
  function subscribe(handler: Subscriber): number {
    subscribers.set(subscriberId++, handler);
    return subscriberId;
  }
  return store;
}