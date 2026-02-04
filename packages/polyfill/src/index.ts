import { hasNativeSidePanel, isArc } from "./detect";
import { createSidePanelNamespace } from "./api";

export { ChromeEvent } from "./event";
export { isArc, hasNativeSidePanel } from "./detect";
export type { SidePanelOptions, PanelBehavior, OpenOptions } from "./types";

export function install({ force = false } = {}): boolean {
  if (!force && hasNativeSidePanel() && !isArc()) return false;

  if (typeof chrome === "undefined") {
    (globalThis as any).chrome = {};
  }

  (chrome as any).sidePanel = createSidePanelNamespace();
  return true;
}

// Auto-install when loaded as IIFE — always force since this is used by the patcher
declare const ServiceWorkerGlobalScope: any;
if (typeof window !== "undefined" || typeof ServiceWorkerGlobalScope !== "undefined") {
  install({ force: true });

  // The extension's init code already called setPanelBehavior before we were injected,
  // so the click handler was never registered. Auto-register it if the manifest has side_panel.
  try {
    const manifest = chrome.runtime.getManifest() as any;
    if (manifest?.side_panel?.default_path) {
      (chrome as any).sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  } catch {}
}
