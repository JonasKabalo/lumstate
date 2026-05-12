// Lumstate TypeScript Declarations

export type StateFactory<S> = () => S;
export type StateOrFactory<S> = S | StateFactory<S>;
export type Actions<S> = Record<string, (state: S, ...args: any[]) => void>;
export type Getters<S> = Record<string, (state: S) => any>;
export type Subscriber<S> = (state: Readonly<S>) => void;
export type Unsubscribe = () => void;

export interface StoreOptions<S, A extends Actions<S>, G extends Getters<S>> {
  state: StateOrFactory<S>;
  actions?: A;
  getters?: G;
}

export type BoundActions<S, A extends Actions<S>> = {
  [K in keyof A]: (...args: A[K] extends (state: S, ...args: infer P) => void ? P : never) => void;
};

export type ComputedGetters<S, G extends Getters<S>> = {
  readonly [K in keyof G]: ReturnType<G[K]>;
};

export interface StoreInstance<S, A extends Actions<S>, G extends Getters<S>>
  extends BoundActions<S, A> {
  readonly state: Readonly<S>;
  subscribe(callback: Subscriber<S>): Unsubscribe;
  patch(partial: Partial<S>): void;
  reset(): void;
  getters: ComputedGetters<S, G>;
}

export type UseStore<S, A extends Actions<S>, G extends Getters<S>> =
  () => StoreInstance<S, A, G>;

/**
 * Define a new Lumstate store.
 *
 * @example
 * const useCounterStore = defineStore('counter', {
 *   state: () => ({ count: 0 }),
 *   actions: {
 *     increment(state) { state.count++ },
 *     add(state, n: number) { state.count += n },
 *   },
 *   getters: {
 *     doubled: (state) => state.count * 2,
 *   },
 * });
 */
export function defineStore<
  S extends object,
  A extends Actions<S> = Record<never, never>,
  G extends Getters<S> = Record<never, never>
>(name: string, options: StoreOptions<S, A, G>): UseStore<S, A, G>;

/**
 * Mark the user as logged in.
 * Prevents auto-wipe on page unload so state persists across navigation.
 */
export function markLoggedIn(): void;

/**
 * Logout: destroys all store state across all tabs immediately.
 */
export function logout(): void;

/**
 * Returns a debug snapshot of all active stores.
 */
export function getDebugSnapshot(): Record<string, unknown>;

// ─── React adapter ───────────────────────────────────────────────────────────
// import { useLumstate } from 'lumstate/react'
declare module 'lumstate/react' {
  import type { UseStore, StoreInstance, Actions, Getters } from 'lumstate';
  export function useLumstate<S extends object, A extends Actions<S>, G extends Getters<S>>(
    storeHook: UseStore<S, A, G>
  ): StoreInstance<S, A, G>;
}

// ─── Vue 3 adapter ───────────────────────────────────────────────────────────
// import { useLumstate } from 'lumstate/vue'
declare module 'lumstate/vue' {
  import type { UseStore, StoreInstance, Actions, Getters } from 'lumstate';
  export function useLumstate<S extends object, A extends Actions<S>, G extends Getters<S>>(
    storeHook: UseStore<S, A, G>
  ): StoreInstance<S, A, G>;
}

// ─── Svelte adapter ──────────────────────────────────────────────────────────
// import { toSvelteStore } from 'lumstate/svelte'
declare module 'lumstate/svelte' {
  import type { UseStore, StoreInstance, Actions, Getters } from 'lumstate';
  import type { Readable } from 'svelte/store';
  export function toSvelteStore<S extends object, A extends Actions<S>, G extends Getters<S>>(
    storeHook: UseStore<S, A, G>
  ): Readable<StoreInstance<S, A, G>>;
}

// ─── Vanilla JS adapter ──────────────────────────────────────────────────────
// import { bindStore } from 'lumstate/vanilla'
declare module 'lumstate/vanilla' {
  import type { UseStore, StoreInstance, Actions, Getters, Subscriber, Unsubscribe } from 'lumstate';
  export interface WatchableStore<S, A extends Actions<S>, G extends Getters<S>>
    extends StoreInstance<S, A, G> {
    watch(callback: Subscriber<S>): Unsubscribe;
  }
  export function bindStore<S extends object, A extends Actions<S>, G extends Getters<S>>(
    storeHook: UseStore<S, A, G>
  ): WatchableStore<S, A, G>;
}
