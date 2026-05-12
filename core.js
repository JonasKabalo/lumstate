/**
 * Lumstate Core — In-memory, session-scoped state engine.
 * No localStorage. No sessionStorage. No cookies.
 * State lives in memory, syncs across tabs via BroadcastChannel,
 * and is destroyed when the session ends.
 */

const CHANNEL_NAME = '__lumstate__';
const SESSION_KEY = '__lumstate_session__';

// ─── Unique tab/session identity ────────────────────────────────────────────
function getSessionId() {
  // Use sessionStorage ONLY to maintain tab identity — not to store state.
  if (typeof sessionStorage === 'undefined') {
    return 'vx_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'vx_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ─── Internal store registry ─────────────────────────────────────────────────
const _stores = new Map();       // storeName → { state, actions, subscribers }
const _sessionId = getSessionId();
let _channel = null;
let _loggedIn = false;

function getChannel() {
  if (!_channel && typeof BroadcastChannel !== 'undefined') {
    _channel = new BroadcastChannel(CHANNEL_NAME);
    _channel.onmessage = handleChannelMessage;
  }
  return _channel;
}

function broadcast(type, payload) {
  const ch = getChannel();
  if (ch) ch.postMessage({ type, payload, from: _sessionId });
}

function handleChannelMessage({ data }) {
  if (!data || data.from === _sessionId) return;

  switch (data.type) {
    case 'PATCH': {
      const { storeName, patch } = data.payload;
      const store = _stores.get(storeName);
      if (store) {
        Object.assign(store.state, patch);
        notify(storeName);
      }
      break;
    }
    case 'RESET': {
      const { storeName } = data.payload;
      const store = _stores.get(storeName);
      if (store) {
        Object.assign(store.state, deepClone(store._initial));
        notify(storeName);
      }
      break;
    }
    case 'DESTROY_ALL': {
      _destroyAllLocal();
      break;
    }
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function notify(storeName) {
  const store = _stores.get(storeName);
  if (!store) return;
  const snapshot = deepClone(store.state);
  store.subscribers.forEach(fn => fn(snapshot));
}

function _destroyAllLocal() {
  _stores.forEach((store, name) => {
    Object.keys(store.state).forEach(k => delete store.state[k]);
    store.subscribers.clear();
  });
  _stores.clear();
}

// ─── Auto-cleanup on tab/window close ────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (!_loggedIn) {
      broadcast('DESTROY_ALL', {});
    }
    if (_channel) {
      _channel.close();
      _channel = null;
    }
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * defineStore(name, options)
 *
 * @param {string} name - Unique store name
 * @param {object} options
 * @param {object} options.state - Factory function or plain object for initial state
 * @param {object} [options.actions] - Mutating methods (receive state proxy)
 * @param {object} [options.getters] - Computed derivations (receive state snapshot)
 *
 * @returns {function} useStore — call it anywhere to get the store instance
 */
export function defineStore(name, { state: stateDef, actions = {}, getters = {} }) {
  return function useStore() {
    if (!_stores.has(name)) {
      const initialState = typeof stateDef === 'function' ? stateDef() : deepClone(stateDef);

      const storeEntry = {
        state: deepClone(initialState),
        _initial: deepClone(initialState),
        subscribers: new Set(),
      };

      _stores.set(name, storeEntry);
    }

    const entry = _stores.get(name);

    // Bound actions
    const boundActions = {};
    for (const [key, fn] of Object.entries(actions)) {
      boundActions[key] = (...args) => {
        const before = deepClone(entry.state);
        fn(entry.state, ...args);
        const after = deepClone(entry.state);

        // Compute patch (changed keys only)
        const patch = {};
        for (const k of Object.keys(after)) {
          if (JSON.stringify(after[k]) !== JSON.stringify(before[k])) {
            patch[k] = after[k];
          }
        }

        if (Object.keys(patch).length > 0) {
          notify(name);
          broadcast('PATCH', { storeName: name, patch });
        }
      };
    }

    // Computed getters
    const computedGetters = {};
    for (const [key, fn] of Object.entries(getters)) {
      Object.defineProperty(computedGetters, key, {
        get: () => fn(deepClone(entry.state)),
        enumerable: true,
      });
    }

    return {
      /** Read-only snapshot of current state */
      get state() {
        return deepClone(entry.state);
      },

      /** Subscribe to state changes. Returns unsubscribe function. */
      subscribe(callback) {
        entry.subscribers.add(callback);
        // Emit current state immediately
        callback(deepClone(entry.state));
        return () => entry.subscribers.delete(callback);
      },

      /** Patch state directly (shallow merge) */
      patch(partial) {
        Object.assign(entry.state, partial);
        notify(name);
        broadcast('PATCH', { storeName: name, patch: partial });
      },

      /** Reset store to initial state */
      reset() {
        Object.assign(entry.state, deepClone(entry._initial));
        notify(name);
        broadcast('RESET', { storeName: name });
      },

      /** Bound action methods */
      ...boundActions,

      /** Computed getter values */
      getters: computedGetters,
    };
  };
}

/**
 * Mark the user as logged in.
 * Prevents auto-wipe on page unload.
 */
export function markLoggedIn() {
  _loggedIn = true;
}

/**
 * Logout: destroys ALL store state across all tabs and cleans up.
 */
export function logout() {
  _loggedIn = false;
  broadcast('DESTROY_ALL', {});
  _destroyAllLocal();
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Get a raw state snapshot for all stores (useful for debugging).
 */
export function getDebugSnapshot() {
  const snap = {};
  _stores.forEach((entry, name) => {
    snap[name] = deepClone(entry.state);
  });
  return snap;
}
