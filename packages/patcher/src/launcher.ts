import { spawn, type ChildProcess } from "node:child_process";
import { platform } from "node:os";

const ARC_PATHS: Record<string, string> = {
  darwin: "/Applications/Arc.app/Contents/MacOS/Arc",
};

export function launchArc(port: number): ChildProcess {
  const arcPath = ARC_PATHS[platform()];
  if (!arcPath) {
    throw new Error(`Unsupported platform: ${platform()}. Only macOS is supported.`);
  }

  console.log(`Launching Arc with --remote-debugging-port=${port}`);
  const child = spawn(arcPath, [`--remote-debugging-port=${port}`], {
    stdio: "ignore",
    detached: true,
  });
  child.unref();
  return child;
}

export async function waitForDebugger(port: number, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for CDP on port ${port}`);
}
