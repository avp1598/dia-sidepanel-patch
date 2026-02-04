import { DEFAULT_STATE, type SidePanelState } from "./types";

const STORAGE_KEY = "__sidePanelPolyfill";

// Eagerly initialized so sync callers always have a working state
let cached: SidePanelState = structuredClone(DEFAULT_STATE);
let hydrated = false;

// Hydrate from storage in the background
async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const result = await chrome.storage.session.get(STORAGE_KEY);
    if (result[STORAGE_KEY]) {
      cached = result[STORAGE_KEY];
    }
  } catch {
    // storage.session may not be available — keep the eager default
  }
}
hydrate();

export async function loadState(): Promise<SidePanelState> {
  return cached;
}

export async function saveState(state: SidePanelState): Promise<void> {
  cached = state;
  try {
    await chrome.storage.session.set({ [STORAGE_KEY]: state });
  } catch (e) {
    console.error("[sidePanel polyfill] failed to persist state:", e);
  }
}
