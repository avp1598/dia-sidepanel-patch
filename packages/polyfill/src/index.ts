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
}
