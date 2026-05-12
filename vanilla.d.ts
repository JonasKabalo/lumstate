export { defineStore, markLoggedIn, logout, getDebugSnapshot } from './index.js';
import type { UseStore, StoreInstance, Actions, Getters, Subscriber, Unsubscribe } from './index.js';

export type WatchableStore<S, A extends Actions<S>, G extends Getters<S>> =
  StoreInstance<S, A, G> & {
    watch(callback: Subscriber<S>): Unsubscribe;
  };

export function bindStore<
  S extends object,
  A extends Actions<S>,
  G extends Getters<S>
>(storeHook: UseStore<S, A, G>): WatchableStore<S, A, G>;
