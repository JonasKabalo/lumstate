/**
 * Volvex — Vue 3 Adapter
 * Provides useVolvex() composable.
 *
 * Usage:
 *   const { state, increment, getters } = useVolvex(useCounterStore)
 */

import { reactive, onUnmounted, readonly } from 'vue';

/**
 * useVolvex(storeHook)
 *
 * @param {function} storeHook - A store returned by defineStore(...)
 * @returns Reactive store instance
 */
export function useVolvex(storeHook) {
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
