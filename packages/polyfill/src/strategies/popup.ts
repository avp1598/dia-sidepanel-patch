import type { OpenOptions } from "../types";

const popupWindows = new Map<string, number>();
const SIDEBAR_WIDTH = 420;

function panelKey(opts: OpenOptions): string {
  if (opts.tabId != null) return `tab:${opts.tabId}`;
  if (opts.windowId != null) return `win:${opts.windowId}`;
  return "global";
}

export async function openPopup(panelUrl: string, opts: OpenOptions): Promise<void> {
  const key = panelKey(opts);

  const existing = popupWindows.get(key);
  if (existing != null) {
    try {
      await chrome.windows.update(existing, { focused: true });
      return;
    } catch {
      popupWindows.delete(key);
    }
  }

  // Position as a sidebar strip on the right edge of the parent window
  let left = 0;
  let top = 0;
  let height = 800;
  let parentId: number | undefined;

  try {
    const targetWindowId = opts.windowId ?? (opts.tabId != null
      ? (await chrome.tabs.get(opts.tabId)).windowId
      : chrome.windows.WINDOW_ID_CURRENT);

    const win = await chrome.windows.get(targetWindowId);
    parentId = win.id;

    // Shrink the parent window to make room, then place sidebar next to it
    const parentWidth = win.width ?? 1200;
    const parentLeft = win.left ?? 0;
    top = win.top ?? 0;
    height = win.height ?? 800;

    if (parentWidth > SIDEBAR_WIDTH + 400) {
      // Shrink parent and place sidebar in the freed space
      const newParentWidth = parentWidth - SIDEBAR_WIDTH;
      await chrome.windows.update(targetWindowId, { width: newParentWidth });
      left = parentLeft + newParentWidth;
    } else {
      // Not enough room to shrink — place adjacent
      left = parentLeft + parentWidth;
    }
  } catch {
    // Best effort positioning
  }

  const fullUrl = chrome.runtime.getURL(panelUrl);
  const popup = await chrome.windows.create({
    url: fullUrl,
    type: "popup",
    width: SIDEBAR_WIDTH,
    height,
    left,
    top,
    focused: true,
  });

  if (popup.id != null) {
    popupWindows.set(key, popup.id);

    const onRemoved = (windowId: number) => {
      if (windowId === popup.id) {
        popupWindows.delete(key);
        // Restore parent window width
        if (parentId != null) {
          chrome.windows.get(parentId).then(win => {
            chrome.windows.update(parentId!, {
              width: (win.width ?? 800) + SIDEBAR_WIDTH,
            }).catch(() => {});
          }).catch(() => {});
        }
        chrome.windows.onRemoved.removeListener(onRemoved);
      }
    };
    chrome.windows.onRemoved.addListener(onRemoved);
  }
}

export async function closePopup(opts: OpenOptions): Promise<boolean> {
  const key = panelKey(opts);
  const windowId = popupWindows.get(key);
  if (windowId == null) return false;

  popupWindows.delete(key);
  try {
    await chrome.windows.remove(windowId);
  } catch {
    // Already closed
  }
  return true;
}

export function isPopupOpen(opts: OpenOptions): boolean {
  return popupWindows.has(panelKey(opts));
}
