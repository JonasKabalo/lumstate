/**
 * Vaultsync — React Adapter
 * Provides useVaultsync() hook for React components.
 *
 * Usage:
 *   const { state, increment, getters } = useVaultsync(useCounterStore);
 */

import { useEffect, useReducer, useRef } from 'react';

/**
 * useVaultsync(storeHook)
 *
 * @param {function} storeHook - A store returned by defineStore(...)
 * @returns Store instance with reactive state
 */
export function useVaultsync(storeHook) {
  const storeRef = useRef(null);
  const [, forceRender] = useReducer(x => x + 1, 0);

  if (!storeRef.current) {
    storeRef.current = storeHook();
  }

  useEffect(() => {
    const store = storeRef.current;
    // Subscribe; the subscription fires on every state change
    const unsub = store.subscribe(() => forceRender());
    return unsub;
  }, []);

  return storeRef.current;
}
