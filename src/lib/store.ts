import { useSyncExternalStore } from "react";
import { seedState } from "../data/seed";
import type { LockerState } from "./types";

// Prototype-only state: everything lives in localStorage, so the fan app and a club store
// open side by side (or in iframes) stay in sync. The real thing is Supabase.
const KEY = "the-locker-prototype:v7";

function load(): LockerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LockerState;
  } catch {
    // Storage blocked or corrupt: fall back to seed data.
  }
  return seedState();
}

let state = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const getState = () => state;

export function setState(update: (s: LockerState) => LockerState) {
  state = update(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Keep working in memory.
  }
  emit();
}

export const resetState = () => setState(() => seedState());

window.addEventListener("storage", (e) => {
  if (e.key === KEY || e.key === null) {
    state = load();
    emit();
  }
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const useLocker = () => useSyncExternalStore(subscribe, getState);
