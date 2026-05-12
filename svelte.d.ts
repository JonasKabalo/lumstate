import type { UseStore, StoreInstance, Actions, Getters } from './index.js';
import type { Readable } from 'svelte/store';

export function toSvelteStore<
  S extends object,
  A extends Actions<S>,
  G extends Getters<S>
>(storeHook: UseStore<S, A, G>): Readable<StoreInstance<S, A, G>>;
