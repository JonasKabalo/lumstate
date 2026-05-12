# 🔐 Volvex

**Framework-agnostic, in-memory state management.**  
No `localStorage`. No `sessionStorage`. No cookies.  
State lives in memory, syncs across tabs via `BroadcastChannel`, and **self-destructs** when the session ends.

---

## Why Volvex?

| Feature | localStorage | sessionStorage | Volvex |
|--------|-------------|---------------|---------|
| Persists across tabs | ✅ | ❌ | ✅ (via BroadcastChannel) |
| Cleared on logout | Manual | Manual | **Automatic** |
| Cleared on tab close | ❌ (persists) | ✅ | ✅ (if not logged in) |
| Readable in DevTools | ✅ (security risk) | ✅ (security risk) | ❌ (memory only) |
| Works without auth setup | ✅ | ✅ | ✅ |
| Framework agnostic | ✅ | ✅ | ✅ |
| Reactive / subscribable | ❌ | ❌ | ✅ |
| Actions + Getters | ❌ | ❌ | ✅ |

---

## Install

```bash
npm install volvex
```

---

## Core Concepts

### 1. Define a Store

```js
// stores/counter.js
import { defineStore } from 'volvex';

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, label: 'Counter' }),

  actions: {
    increment(state) {
      state.count++;
    },
    decrement(state) {
      state.count--;
    },
    add(state, n) {
      state.count += n;
    },
    reset(state) {
      state.count = 0;
    },
  },

  getters: {
    doubled: (state) => state.count * 2,
    isPositive: (state) => state.count > 0,
  },
});
```

---

## Framework Usage

### ⚛️ React

```jsx
import { useVolvex } from 'volvex/react';
import { useCounterStore } from './stores/counter';

function Counter() {
  const store = useVolvex(useCounterStore);

  return (
    <div>
      <p>Count: {store.state.count}</p>
      <p>Doubled: {store.getters.doubled}</p>
      <button onClick={() => store.increment()}>+</button>
      <button onClick={() => store.decrement()}>-</button>
      <button onClick={() => store.add(10)}>+10</button>
    </div>
  );
}
```

---

### 🟢 Vue 3

```vue
<script setup>
import { useVolvex } from 'volvex/vue';
import { useCounterStore } from './stores/counter';

const store = useVolvex(useCounterStore);
</script>

<template>
  <div>
    <p>Count: {{ store.state.count }}</p>
    <p>Doubled: {{ store.getters.doubled }}</p>
    <button @click="store.increment()">+</button>
    <button @click="store.decrement()">−</button>
  </div>
</template>
```

---

### 🧡 Svelte

```svelte
<script>
  import { toSvelteStore } from 'volvex/svelte';
  import { useCounterStore } from './stores/counter';

  const counter = toSvelteStore(useCounterStore);
</script>

<p>Count: {$counter.state.count}</p>
<button on:click={() => $counter.increment()}>+</button>
```

---

### 🍦 Vanilla JS

```js
import { bindStore } from 'volvex/vanilla';
import { useCounterStore } from './stores/counter';

const counter = bindStore(useCounterStore);

// Watch state changes
const unwatch = counter.watch((state) => {
  document.getElementById('count').textContent = state.count;
});

// Trigger actions
document.getElementById('btn-inc').addEventListener('click', () => counter.increment());
document.getElementById('btn-dec').addEventListener('click', () => counter.decrement());

// Stop watching when done
// unwatch();
```

---

## Session & Auth Lifecycle

### When user logs in

```js
import { markLoggedIn } from 'volvex';

// Call this after successful login.
// Prevents state from being wiped when navigating away.
markLoggedIn();
```

### When user logs out

```js
import { logout } from 'volvex';

// Wipes ALL state across ALL tabs instantly.
// No trace of user data remains anywhere.
logout();
```

### Automatic cleanup

- **Not logged in** → state is destroyed when the browser tab closes (via `beforeunload`)
- **Logged in** → state persists as long as at least one tab is open; destroyed on `logout()`
- **Multiple tabs** → state syncs automatically via `BroadcastChannel`

---

## Low-level API

```js
// Direct patch (shallow merge)
const store = useCounterStore();
store.patch({ count: 42 });

// Reset to initial state
store.reset();

// Subscribe manually
const unsub = store.subscribe((state) => {
  console.log('State changed:', state);
});

// Cleanup subscription
unsub();
```

---

## Debug

```js
import { getDebugSnapshot } from 'volvex';

// Returns a snapshot of all active stores
console.log(getDebugSnapshot());
// { counter: { count: 5, label: 'Counter' }, user: { name: 'Alice' } }
```

---

## TypeScript

Volvex is fully typed out of the box. Types are inferred automatically from your `state`, `actions`, and `getters` definitions.

```ts
import { defineStore } from 'volvex';

interface UserState {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    name: '',
    email: '',
    role: 'user',
  }),
  actions: {
    setUser(state, user: Pick<UserState, 'name' | 'email'>) {
      state.name = user.name;
      state.email = user.email;
    },
    promote(state) {
      state.role = 'admin';
    },
  },
  getters: {
    isAdmin: (state) => state.role === 'admin',
    displayName: (state) => state.name || 'Anonymous',
  },
});
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                        Browser Tab A                    │
│                                                         │
│  defineStore() → In-memory Map (not in DevTools)        │
│       ↓                                                 │
│  action() → mutates state → notifies subscribers        │
│       ↓                                                 │
│  BroadcastChannel.postMessage({ type: 'PATCH', ... })   │
└──────────────────────────┬──────────────────────────────┘
                           │ BroadcastChannel
┌──────────────────────────▼──────────────────────────────┐
│                        Browser Tab B                    │
│                                                         │
│  onmessage → apply patch → notify subscribers           │
└─────────────────────────────────────────────────────────┘

On logout() or unlogged tab close:
→ DESTROY_ALL broadcast → all tabs wipe memory instantly
```

---

## Security Properties

- ✅ State never written to disk (no localStorage/sessionStorage/cookies)
- ✅ Not visible in browser DevTools Storage tab
- ✅ Automatically wiped on logout or unauthenticated session end
- ✅ `BroadcastChannel` is same-origin only (no cross-site leakage)
- ✅ Each store is isolated by name — no global namespace collisions

---

## License

MIT
