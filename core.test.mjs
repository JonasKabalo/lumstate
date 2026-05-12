/**
 * Lumstate — Core Tests
 * Run with: node core.test.mjs
 */

import { defineStore, logout, getDebugSnapshot } from './core.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected)
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${actual}`);
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
console.log('\n🔐 Lumstate Core Tests\n');

// 1. Basic state
test('defines a store with initial state', () => {
  const useStore = defineStore('test_basic', {
    state: () => ({ count: 0 }),
  });
  const store = useStore();
  expect(store.state.count).toBe(0);
});

// 2. Actions
test('actions mutate state', () => {
  const useStore = defineStore('test_actions', {
    state: () => ({ count: 0 }),
    actions: {
      increment(state) { state.count++; },
      add(state, n) { state.count += n; },
    },
  });
  const store = useStore();
  store.increment();
  expect(store.state.count).toBe(1);
  store.add(5);
  expect(store.state.count).toBe(6);
});

// 3. Getters
test('getters compute derived state', () => {
  const useStore = defineStore('test_getters', {
    state: () => ({ count: 4 }),
    getters: {
      doubled: (s) => s.count * 2,
      isEven: (s) => s.count % 2 === 0,
    },
  });
  const store = useStore();
  expect(store.getters.doubled).toBe(8);
  expect(store.getters.isEven).toBe(true);
});

// 4. Subscribe
test('subscribe fires with current state immediately', () => {
  const useStore = defineStore('test_subscribe_init', {
    state: () => ({ value: 99 }),
  });
  const store = useStore();
  let received = null;
  const unsub = store.subscribe((s) => { received = s.value; });
  expect(received).toBe(99);
  unsub();
});

test('subscribe fires on state change', () => {
  const useStore = defineStore('test_subscribe_change', {
    state: () => ({ count: 0 }),
    actions: { inc(s) { s.count++; } },
  });
  const store = useStore();
  let calls = 0;
  let lastValue = null;
  store.subscribe((s) => {
    calls++;
    lastValue = s.count;
  });
  store.inc();
  store.inc();
  expect(calls).toBe(3); // 1 immediate + 2 updates
  expect(lastValue).toBe(2);
});

// 5. Unsubscribe
test('unsubscribe stops receiving updates', () => {
  const useStore = defineStore('test_unsub', {
    state: () => ({ x: 0 }),
    actions: { bump(s) { s.x++; } },
  });
  const store = useStore();
  let calls = 0;
  const unsub = store.subscribe(() => calls++);
  store.bump(); // +1
  unsub();
  store.bump(); // should NOT trigger
  store.bump(); // should NOT trigger
  expect(calls).toBe(2); // 1 initial + 1 update
});

// 6. Patch
test('patch does a shallow merge', () => {
  const useStore = defineStore('test_patch', {
    state: () => ({ a: 1, b: 2, c: 3 }),
  });
  const store = useStore();
  store.patch({ b: 99 });
  expect(store.state.a).toBe(1);
  expect(store.state.b).toBe(99);
  expect(store.state.c).toBe(3);
});

// 7. Reset
test('reset restores initial state', () => {
  const useStore = defineStore('test_reset', {
    state: () => ({ count: 0 }),
    actions: { inc(s) { s.count++; } },
  });
  const store = useStore();
  store.inc();
  store.inc();
  store.inc();
  expect(store.state.count).toBe(3);
  store.reset();
  expect(store.state.count).toBe(0);
});

// 8. Multiple stores are isolated
test('multiple stores do not share state', () => {
  const useA = defineStore('test_iso_a', { state: () => ({ n: 1 }) });
  const useB = defineStore('test_iso_b', { state: () => ({ n: 2 }) });
  const a = useA();
  const b = useB();
  a.patch({ n: 100 });
  expect(a.state.n).toBe(100);
  expect(b.state.n).toBe(2);
});

// 9. State snapshots are immutable (mutations don't bleed)
test('state snapshot is a deep copy — external mutations do not affect store', () => {
  const useStore = defineStore('test_immutable', {
    state: () => ({ items: [1, 2, 3] }),
  });
  const store = useStore();
  const snapshot = store.state;
  snapshot.items.push(999); // mutate snapshot
  expect(store.state.items.length).toBe(3); // store unchanged
});

// 10. Debug snapshot
test('getDebugSnapshot returns all stores', () => {
  const snap = getDebugSnapshot();
  expect(typeof snap).toBe('object');
  expect(snap['test_basic'] !== undefined).toBeTruthy();
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  Tests: ${passed + failed}  ✅ ${passed}  ❌ ${failed}`);
console.log(`${'─'.repeat(40)}\n`);

if (failed > 0) process.exit(1);
