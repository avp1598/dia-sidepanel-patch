import CDP from "chrome-remote-interface";

export interface ExtensionTarget {
  id: string;
  title: string;
  url: string;
  type: string;
  webSocketDebuggerUrl?: string;
}

export async function listTargets(port: number): Promise<ExtensionTarget[]> {
  const targets = await CDP.List({ port });
  return targets.filter(
    (t: any) =>
      t.url?.startsWith("chrome-extension://") &&
      (t.type === "service_worker" || t.type === "background_page")
  );
}

export async function connectToTarget(port: number, targetId: string) {
  return CDP({ port, target: targetId });
}

export async function connectToBrowser(port: number) {
  return CDP({ port });
}
