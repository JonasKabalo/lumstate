/**
 * Volvex — Framework-agnostic in-memory state management
 *
 * No localStorage. No sessionStorage. No cookies.
 * State lives in memory, syncs across tabs via BroadcastChannel,
 * and is destroyed when the session ends or logout() is called.
 */

export { defineStore, markLoggedIn, logout, getDebugSnapshot } from './core.js';
