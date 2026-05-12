/**
 * Volvex — Vanilla JS Adapter
 * Simple subscription-based watcher for non-framework usage.
 *
 * Usage:
 *   const counter = bindStore(useCounterStore);
 *   counter.watch((state) => console.log(state.count));
 *   counter.increment();
 */

/**
 * bindStore(storeHook)
 *
 * @param {function} storeHook - A store returned by defineStore(...)
 * @returns Store instance enriched with a .watch() helper
 */
export function bindStore(storeHook) {
  const store = storeHook();

  // Proxy keeps the reactive `state` getter alive — spreading would freeze it.
  return new Proxy(store, {
    get(target, prop) {
      if (prop === 'watch') return (callback) => store.subscribe(callback);
      return target[prop];
    },
    has(target, prop) {
      return prop === 'watch' || prop in target;
    },
  });
}
