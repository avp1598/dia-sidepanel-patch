import { injectIntoTarget } from "./injector";
import { connectToTarget } from "./cdp";

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

export async function watchAndInject(browserClient: any, port: number): Promise<void> {
  browserClient.Target.targetCreated(async (params: any) => {
    const { targetInfo } = params;

    const isExtensionWorker =
      targetInfo.url?.startsWith("chrome-extension://") &&
      (targetInfo.type === "service_worker" || targetInfo.type === "background_page");

    if (!isExtensionWorker) return;

    console.log(`[inject] New extension target: ${targetInfo.title} (${targetInfo.url})`);

    try {
      const client = await connectWithRetry(port, targetInfo.targetId);
      await injectIntoTarget(client);
      console.log(`[inject] Polyfill injected into ${targetInfo.title}`);
      await client.close();
    } catch (e) {
      console.error(`[inject] Failed for ${targetInfo.title}:`, e);
    }
  });

  await browserClient.Target.setDiscoverTargets({ discover: true });

  console.log("[watch] Watching for extension service worker (re)starts...");
}
