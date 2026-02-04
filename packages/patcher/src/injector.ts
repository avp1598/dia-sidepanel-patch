import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

let cachedPayload: string | null = null;

export function getPolyfillPayload(): string {
  if (cachedPayload) return cachedPayload;

  const require = createRequire(import.meta.url);
  const mainPath = require.resolve("@avp1598/dia-sidepanel-polyfill");
  const bundlePath = join(dirname(mainPath), "index.iife.global.js");

  cachedPayload = readFileSync(bundlePath, "utf-8");
  return cachedPayload;
}

export async function injectIntoTarget(client: any): Promise<void> {
  const payload = getPolyfillPayload();
  await client.Runtime.evaluate({
    expression: payload,
    awaitPromise: false,
    returnByValue: false,
  });
}
