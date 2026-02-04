# Dia SidePanel Patch

Make `chrome.sidePanel` extensions work in [Dia browser](https://dia.dev).

Dia doesn't support the Chrome Side Panel API, so extensions like Claude, Grammarly, and others that use `chrome.sidePanel` don't work. This project fixes that by injecting a polyfill into every extension at runtime.

## Quick Start

```bash
# Make sure Dia is running with the debugging port
/Applications/Dia.app/Contents/MacOS/Dia --remote-debugging-port=9222

# Run the patcher (keeps running to catch extension restarts)
npx @avp1598/dia-sidepanel-patcher
```

Or launch Dia and patch in one command:

```bash
npx @avp1598/dia-sidepanel-patcher --launch
```

## Auto-Start on Login

Install globally and set up auto-start so you never have to think about it:

```bash
npm install -g @avp1598/dia-sidepanel-patcher

# This creates a macOS LaunchAgent that runs the patcher every time you log in
dia-sidepanel-patcher install

# To remove
dia-sidepanel-patcher uninstall

# Check status
dia-sidepanel-patcher status
```

## How It Works

1. **Connects to Dia** via Chrome DevTools Protocol (CDP) on port 9222
2. **Discovers all extension service workers** running in Dia
3. **Injects a polyfill** that replaces the broken `chrome.sidePanel` with a working implementation
4. **Watches for restarts** — when an extension's service worker restarts, the polyfill is re-injected

The polyfill implements the full `chrome.sidePanel` API surface:
- `setOptions()` / `getOptions()`
- `setPanelBehavior()` / `getPanelBehavior()`
- `open()` / `close()`
- `onOpened` / `onClosed` events

Side panels open as popup windows positioned next to the browser window, visually mimicking a sidebar.

## For Extension Developers

If you develop a Chrome extension and want it to work in Dia, you can use the polyfill library directly:

```bash
npm install @avp1598/dia-sidepanel-polyfill
```

```typescript
import { install } from "@avp1598/dia-sidepanel-polyfill";

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
    "scripts": ["node_modules/@avp1598/dia-sidepanel-polyfill/dist/index.iife.global.js", "service-worker.js"]
  }
}
```

## CLI Reference

```
dia-sidepanel-patcher [options]         Run the patcher
dia-sidepanel-patcher install [options] Auto-start on login
dia-sidepanel-patcher uninstall         Remove auto-start
dia-sidepanel-patcher status            Check auto-start status

Options:
  -p, --port <number>  CDP debugging port (default: 9222)
  -l, --launch         Launch Dia with debugging port enabled
  -V, --version        Show version
  -h, --help           Show help
```

## Limitations

- **macOS only** — Dia is macOS-only
- **Requires CDP** — Dia must be started with `--remote-debugging-port`
- **Popup windows, not embedded** — Side panels open as positioned popup windows rather than embedded iframes (Chrome's internal `web_accessible_resources` cache prevents the iframe approach for installed extensions)
- **Race condition on first inject** — The polyfill is injected after the extension's service worker starts, so the initial `chrome.sidePanel` reference is briefly the broken native one. Works because extensions read `chrome.sidePanel` lazily at click time, not at init time.

## Packages

| Package | Description |
|---------|-------------|
| [`@avp1598/dia-sidepanel-patcher`](./packages/patcher) | CLI tool — patches all extensions in Dia |
| [`@avp1598/dia-sidepanel-polyfill`](./packages/polyfill) | Library — drop-in polyfill for your own extensions |

## Development

```bash
git clone https://github.com/avp1598/dia-sidepanel-patch
cd dia-sidepanel-patch
bun install
bun run build
```

## License

MIT
