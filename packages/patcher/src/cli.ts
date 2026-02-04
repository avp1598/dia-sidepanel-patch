import { program } from "commander";
import { launchDia, waitForDebugger } from "./launcher";
import { connectToBrowser, listTargets, connectToTarget } from "./cdp";
import { injectIntoTarget } from "./injector";
import { watchAndInject } from "./watcher";
import { patchExtensionManifests } from "./manifest-patcher";
import { install, uninstall, status } from "./autostart";

async function run(opts: { port: string; launch?: boolean }) {
  const port = parseInt(opts.port, 10);

  patchExtensionManifests();

  if (opts.launch) {
    launchDia(port);
    console.log("Waiting for Dia to start...");
    await waitForDebugger(port);
    console.log("Dia is ready.\n");
  }

  try {
    await fetch(`http://127.0.0.1:${port}/json/version`);
  } catch {
    console.error(
      `Cannot connect to CDP on port ${port}.\n\n` +
      `Start Dia with debugging enabled:\n` +
      `  /Applications/Dia.app/Contents/MacOS/Dia --remote-debugging-port=${port}\n\n` +
      `Or use --launch to start it automatically:\n` +
      `  dia-sidepanel-patcher --launch\n`
    );
    process.exit(1);
  }

  const browser = await connectToBrowser(port);
  await watchAndInject(browser, port);

  const targets = await listTargets(port);
  console.log(`Found ${targets.length} extension target(s)`);

  for (const target of targets) {
    console.log(`Injecting into: ${target.title} (${target.url})`);
    try {
      const client = await connectToTarget(port, target.id);
      await injectIntoTarget(client);
      await client.Runtime.evaluate({
        expression: "chrome.runtime.reload()",
        awaitPromise: false,
        returnByValue: false,
      });
      console.log(`  ✓ Injected + triggered reload`);
      await client.close();
    } catch (e) {
      console.error(`  ✗ Failed:`, e);
    }
  }

  console.log("\nPatcher is running. Press Ctrl+C to stop.\n");

  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await browser.close();
    process.exit(0);
  });
}

program
  .name("dia-sidepanel-patcher")
  .description("Make chrome.sidePanel extensions work in Dia browser")
  .version("0.1.0")
  .option("-p, --port <number>", "CDP debugging port", "9222")
  .option("-l, --launch", "Launch Dia with debugging port enabled")
  .action(run);

program
  .command("install")
  .description("Auto-start patcher every time Dia launches (macOS LaunchAgent)")
  .option("-p, --port <number>", "CDP debugging port", "9222")
  .action((opts) => install(parseInt(opts.port, 10)));

program
  .command("uninstall")
  .description("Remove auto-start")
  .action(() => uninstall());

program
  .command("status")
  .description("Check if auto-start is installed")
  .action(() => status());

program.parse();
