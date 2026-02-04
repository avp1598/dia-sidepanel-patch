export function isArc(): boolean {
  try {
    // Arc injects this CSS custom property into all pages
    if (typeof document !== "undefined") {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--arc-palette-background")
        .trim() !== "";
    }
    // In service worker context, check the userAgent or assume Arc if sidePanel is missing
    return typeof chrome !== "undefined" && chrome.sidePanel === undefined;
  } catch {
    return false;
  }
}

export function hasNativeSidePanel(): boolean {
  try {
    return (
      typeof chrome !== "undefined" &&
      typeof chrome.sidePanel !== "undefined" &&
      typeof chrome.sidePanel.setOptions === "function"
    );
  } catch {
    return false;
  }
}
