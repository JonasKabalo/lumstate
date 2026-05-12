import type { UseStore, StoreInstance, Actions, Getters } from './index.js';

export function useLumstate<
  S extends object,
  A extends Actions<S>,
  G extends Getters<S>
>(storeHook: UseStore<S, A, G>): StoreInstance<S, A, G>;
