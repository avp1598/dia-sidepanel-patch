export function getDefaultPanelPath(): string | undefined {
  try {
    const manifest = chrome.runtime.getManifest() as any;
    return manifest?.side_panel?.default_path ?? undefined;
  } catch {
    return undefined;
  }
}
