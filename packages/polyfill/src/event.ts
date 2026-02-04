type Listener<T extends (...args: any[]) => void> = T;

export class ChromeEvent<T extends (...args: any[]) => void> {
  private listeners: Set<Listener<T>> = new Set();

  addListener(cb: T) {
    this.listeners.add(cb);
  }

  removeListener(cb: T) {
    this.listeners.delete(cb);
  }

  hasListener(cb: T) {
    return this.listeners.has(cb);
  }

  hasListeners() {
    return this.listeners.size > 0;
  }

  dispatch(...args: Parameters<T>) {
    for (const cb of this.listeners) {
      try {
        cb(...args);
      } catch (e) {
        console.error("[sidePanel polyfill] event listener error:", e);
      }
    }
  }
}
