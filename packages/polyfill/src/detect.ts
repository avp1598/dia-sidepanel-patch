export function isDia(): boolean {
  try {
    // In Dia, chrome.sidePanel is undefined - use this as the detection method
    // since we don't know if Dia injects any CSS custom properties
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
