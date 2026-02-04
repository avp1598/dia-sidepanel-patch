export interface SidePanelOptions {
  tabId?: number;
  path?: string;
  enabled?: boolean;
}

export interface PanelBehavior {
  openPanelOnActionClick?: boolean;
}

export interface OpenOptions {
  tabId?: number;
  windowId?: number;
}

export interface SidePanelState {
  globalOptions: SidePanelOptions;
  tabOptions: Record<number, SidePanelOptions>;
  panelBehavior: PanelBehavior;
  openPanels: Record<string, { tabId?: number; windowId?: number }>;
}

export const DEFAULT_STATE: SidePanelState = {
  globalOptions: { enabled: true },
  tabOptions: {},
  panelBehavior: {},
  openPanels: {},
};
