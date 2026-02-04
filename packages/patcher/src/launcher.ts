import { spawn, type ChildProcess } from "node:child_process";
import { platform } from "node:os";

const DIA_PATHS: Record<string, string> = {
  darwin: "/Applications/Dia.app/Contents/MacOS/Dia",
};

export function launchDia(port: number): ChildProcess {
  const diaPath = DIA_PATHS[platform()];
  if (!diaPath) {
    throw new Error(`Unsupported platform: ${platform()}. Only macOS is supported.`);
  }

  console.log(`Launching Dia with --remote-debugging-port=${port}`);
  const child = spawn(diaPath, [`--remote-debugging-port=${port}`], {
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
