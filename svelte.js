/**
 * Volvex — Svelte Adapter
 * Returns a Svelte-compatible readable store.
 *
 * Usage:
 *   const counter = toSvelteStore(useCounterStore);
 *   $: console.log($counter.state.count)
 */

import { readable } from 'svelte/store';

/**
 * toSvelteStore(storeHook)
 *
 * @param {function} storeHook - A store returned by defineStore(...)
 * @returns A Svelte-compatible readable store
 */
export function toSvelteStore(storeHook) {
  const store = storeHook();

  return readable(store, (set) => {
    const unsub = store.subscribe((newState) => {
      // Expose full store API + current state snapshot
      set({ ...store, state: newState });
    });
    return unsub;
  });
}
