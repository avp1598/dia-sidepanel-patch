# Arc SidePanel Patch

Make `chrome.sidePanel` extensions work in [Arc browser](https://arc.net).

Arc never shipped support for the Chrome Side Panel API, so extensions like Claude, Grammarly, and others that use `chrome.sidePanel` don't work. This project fixes that by injecting a polyfill into every extension at runtime.

## Quick Start

```bash
# Make sure Arc is running with the debugging port
/Applications/Arc.app/Contents/MacOS/Arc --remote-debugging-port=9222

# Run the patcher (keeps running to catch extension restarts)
npx @dhravya/arc-sidepanel-patcher
```

Or launch Arc and patch in one command:

```bash
npx @dhravya/arc-sidepanel-patcher --launch
```

## Auto-Start on Login

Install globally and set up auto-start so you never have to think about it:

```bash
npm install -g @dhravya/arc-sidepanel-patcher

# This creates a macOS LaunchAgent that runs the patcher every time you log in
arc-sidepanel-patcher install

# To remove
arc-sidepanel-patcher uninstall

# Check status
arc-sidepanel-patcher status
```

## How It Works

1. **Connects to Arc** via Chrome DevTools Protocol (CDP) on port 9222
2. **Discovers all extension service workers** running in Arc
3. **Injects a polyfill** that replaces the broken `chrome.sidePanel` with a working implementation
4. **Watches for restarts** — when an extension's service worker restarts, the polyfill is re-injected

The polyfill implements the full `chrome.sidePanel` API surface:
- `setOptions()` / `getOptions()`
- `setPanelBehavior()` / `getPanelBehavior()`
- `open()` / `close()`
- `onOpened` / `onClosed` events

Side panels open as popup windows positioned next to the browser window, visually mimicking a sidebar.

## For Extension Developers

If you develop a Chrome extension and want it to work in Arc, you can use the polyfill library directly:

```bash
npm install @dhravya/chrome-sidepanel-polyfill
```

```typescript
import { install } from "@dhravya/chrome-sidepanel-polyfill";

// Only installs if native chrome.sidePanel is missing or broken
install();

// Now use chrome.sidePanel as normal
chrome.sidePanel.setOptions({ path: "sidepanel.html" });
```

Or load the IIFE bundle in your extension's service worker for zero-config setup:

```json
{
  "background": {
    "service_worker": "service-worker.js",
    "scripts": ["node_modules/@dhravya/chrome-sidepanel-polyfill/dist/index.iife.global.js", "service-worker.js"]
  }
}
```

## CLI Reference

```
arc-sidepanel-patcher [options]         Run the patcher
arc-sidepanel-patcher install [options] Auto-start on login
arc-sidepanel-patcher uninstall         Remove auto-start
arc-sidepanel-patcher status            Check auto-start status

Options:
  -p, --port <number>  CDP debugging port (default: 9222)
  -l, --launch         Launch Arc with debugging port enabled
  -V, --version        Show version
  -h, --help           Show help
```

## Limitations

- **macOS only** — Arc is macOS-only
- **Requires CDP** — Arc must be started with `--remote-debugging-port`
- **Popup windows, not embedded** — Side panels open as positioned popup windows rather than embedded iframes (Chrome's internal `web_accessible_resources` cache prevents the iframe approach for installed extensions)
- **Race condition on first inject** — The polyfill is injected after the extension's service worker starts, so the initial `chrome.sidePanel` reference is briefly the broken native one. Works because extensions read `chrome.sidePanel` lazily at click time, not at init time.

## Packages

| Package | Description |
|---------|-------------|
| [`@dhravya/arc-sidepanel-patcher`](./packages/patcher) | CLI tool — patches all extensions in Arc |
| [`@dhravya/chrome-sidepanel-polyfill`](./packages/polyfill) | Library — drop-in polyfill for your own extensions |

## Development

```bash
git clone https://github.com/dhravya/arc-sidepanel-patch
cd arc-sidepanel-patch
pnpm install
pnpm build
```

## License

MIT
