import { injectIntoTarget } from "./injector";
import { listTargets, connectToTarget } from "./cdp";

async function connectWithRetry(port: number, targetId: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await connectToTarget(port, targetId);
    } catch {
      if (i === retries - 1) throw new Error(`Cannot connect to target ${targetId} after ${retries} attempts`);
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
}

// Track which targets we've already injected into
const injectedTargets = new Set<string>();

async function injectNewTargets(port: number): Promise<void> {
  const targets = await listTargets(port);

  for (const target of targets) {
    if (injectedTargets.has(target.id)) continue;

    console.log(`[inject] New extension target: ${target.title} (${target.url})`);

    try {
      const client = await connectWithRetry(port, target.id);
      await injectIntoTarget(client);
      injectedTargets.add(target.id);
      console.log(`[inject] Polyfill injected into ${target.title}`);
      await client.close();
    } catch (e) {
      console.error(`[inject] Failed for ${target.title}:`, e);
    }
  }
}

export function watchAndInject(port: number): void {
  // Dia blocks Target.setDiscoverTargets, so we use polling instead
  console.log("[watch] Watching for extension service worker (re)starts (polling mode)...");

  // Poll every 2 seconds for new extension targets
  setInterval(async () => {
    try {
      await injectNewTargets(port);
    } catch (e) {
      // Silently ignore polling errors (browser might be temporarily unavailable)
    }
  }, 2000);
}
