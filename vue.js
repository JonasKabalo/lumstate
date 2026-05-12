/**
 * Lumstate — Vue 3 Adapter
 * Provides useLumstate() composable.
 *
 * Usage:
 *   const { state, increment, getters } = useLumstate(useCounterStore)
 */

import { reactive, onUnmounted, readonly } from 'vue';
export { defineStore, markLoggedIn, logout, getDebugSnapshot } from './core.js';

/**
 * useLumstate(storeHook)
 *
 * @param {function} storeHook - A store returned by defineStore(...)
 * @returns Reactive store instance
 */
export function useLumstate(storeHook) {
  const store = storeHook();
  const reactiveState = reactive({ ...store.state });

  const unsubscribe = store.subscribe((newState) => {
    Object.assign(reactiveState, newState);
  });

  onUnmounted(unsubscribe);

  // Create a proxy that keeps reactiveState in sync but exposes store API
  return new Proxy(store, {
    get(target, prop) {
      if (prop === 'state') return readonly(reactiveState);
      return target[prop];
    },
  });
}
