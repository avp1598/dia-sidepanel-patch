import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const ARC_EXTENSIONS_DIR = join(
  homedir(),
  "Library",
  "Application Support",
  "Arc",
  "User Data",
  "Default",
  "Extensions"
);

const PATCH_MARKER = "__sidePanelPolyfill_patched";

export function patchExtensionManifests(): string[] {
  if (!existsSync(ARC_EXTENSIONS_DIR)) {
    console.warn(`[manifest] Extensions directory not found: ${ARC_EXTENSIONS_DIR}`);
    return [];
  }

  const patched: string[] = [];

  for (const extId of readdirSync(ARC_EXTENSIONS_DIR)) {
    const extDir = join(ARC_EXTENSIONS_DIR, extId);
    let versions: string[];
    try {
      versions = readdirSync(extDir).filter((v) => !v.startsWith("."));
    } catch {
      continue;
    }

    for (const version of versions) {
      const manifestPath = join(extDir, version, "manifest.json");
      if (!existsSync(manifestPath)) continue;

      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        if (!manifest.permissions?.includes("sidePanel")) continue;
        if (manifest[PATCH_MARKER]) continue;

        const candidates = new Set<string>();
        if (manifest.side_panel?.default_path) {
          candidates.add(manifest.side_panel.default_path);
        }
        candidates.add("sidepanel.html");
        candidates.add("side_panel.html");
        candidates.add("sidebar.html");

        const resources = [...candidates].filter((p) =>
          existsSync(join(extDir, version, p))
        );
        if (resources.length === 0) continue;

        if (!manifest.web_accessible_resources) {
          manifest.web_accessible_resources = [];
        }

        const alreadyAccessible = new Set(
          manifest.web_accessible_resources.flatMap((r: any) => r.resources || [])
        );
        const toAdd = resources.filter((r) => !alreadyAccessible.has(r));
        if (toAdd.length === 0) continue;

        manifest.web_accessible_resources.push({
          resources: toAdd,
          matches: ["<all_urls>"],
        });
        manifest[PATCH_MARKER] = true;

        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`[manifest] Patched ${manifest.name || extId}: made ${toAdd.join(", ")} web-accessible`);
        patched.push(extId);
      } catch (e) {
        console.error(`[manifest] Failed to patch ${extId}:`, e);
      }
    }
  }

  return patched;
}
