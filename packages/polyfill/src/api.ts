import { ChromeEvent } from "./event";
import { loadState, saveState } from "./state";
import { getDefaultPanelPath } from "./manifest";
import { openPopup, closePopup } from "./strategies/popup";
import type { SidePanelOptions, PanelBehavior, OpenOptions } from "./types";

const onOpened = new ChromeEvent<() => void>();
const onClosed = new ChromeEvent<() => void>();

function panelKey(opts: OpenOptions): string {
  if (opts.tabId != null) return `tab:${opts.tabId}`;
  if (opts.windowId != null) return `win:${opts.windowId}`;
  return "global";
}

async function setOptions(options: SidePanelOptions): Promise<void> {
  const state = await loadState();
  if (options.tabId != null) {
    state.tabOptions[options.tabId] = {
      ...state.tabOptions[options.tabId],
      ...options,
    };
  } else {
    state.globalOptions = { ...state.globalOptions, ...options };
  }
  await saveState(state);
}

async function getOptions(filter?: { tabId?: number }): Promise<SidePanelOptions> {
  const state = await loadState();
  if (filter?.tabId != null && state.tabOptions[filter.tabId]) {
    return { ...state.globalOptions, ...state.tabOptions[filter.tabId] };
  }
  return { ...state.globalOptions };
}

async function setPanelBehavior(behavior: PanelBehavior): Promise<void> {
  const state = await loadState();
  state.panelBehavior = { ...state.panelBehavior, ...behavior };
  await saveState(state);

  if (behavior.openPanelOnActionClick) {
    try {
      chrome.action.onClicked.addListener(handleActionClick);
    } catch (e) {
      console.warn("[sidePanel polyfill] chrome.action not available, openPanelOnActionClick will not work:", e);
    }
  }
}

async function getPanelBehavior(): Promise<PanelBehavior> {
  const state = await loadState();
  return { ...state.panelBehavior };
}

async function open(opts: OpenOptions = {}): Promise<void> {
  const state = await loadState();

  const resolved = opts.tabId != null && state.tabOptions[opts.tabId]
    ? { ...state.globalOptions, ...state.tabOptions[opts.tabId] }
    : { ...state.globalOptions };
  const path = resolved.path ?? getDefaultPanelPath();
  if (!path) throw new Error("No side panel path configured");

  console.log("[sidePanel polyfill] opening sidebar popup");
  await openPopup(path, opts);

  const key = panelKey(opts);
  state.openPanels[key] = { ...opts };
  await saveState(state);
  onOpened.dispatch();
}

async function close(opts: OpenOptions = {}): Promise<void> {
  const state = await loadState();
  const key = panelKey(opts);
  const panel = state.openPanels[key];

  await closePopup(opts);

  delete state.openPanels[key];
  await saveState(state);
  onClosed.dispatch();
}

async function handleActionClick(tab: chrome.tabs.Tab) {
  if (!tab.id) return;
  const state = await loadState();
  const key = `tab:${tab.id}`;
  if (state.openPanels[key]) {
    await close({ tabId: tab.id });
  } else {
    await open({ tabId: tab.id });
  }
}

export function createSidePanelNamespace() {
  return {
    setOptions,
    getOptions,
    setPanelBehavior,
    getPanelBehavior,
    open,
    close,
    onOpened,
    onClosed,
  };
}
