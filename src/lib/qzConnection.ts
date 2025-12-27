// Global, singleton QZ Tray connection manager.
// Ensures qz.websocket.connect() is invoked at most once for the entire app lifecycle.

export type QzConnectionStatus = "idle" | "connecting" | "connected" | "error";

export type QzConnectionSnapshot = {
  status: QzConnectionStatus;
  isConnected: boolean;
  error: string | null;
};

let snapshot: QzConnectionSnapshot = Object.freeze({
  status: "idle",
  isConnected: false,
  error: null,
});

const listeners = new Set<() => void>();
let connectPromise: Promise<boolean> | null = null;
let initialized = false;

function emit() {
  listeners.forEach((l) => l());
}

function setSnapshot(next: Partial<QzConnectionSnapshot>) {
  snapshot = Object.freeze({ ...snapshot, ...next });
  emit();
}

function setUpSecurityPromises(qz: any) {
  if (!qz?.security) return;

  if (typeof qz.security.setCertificatePromise === "function") {
    qz.security.setCertificatePromise(() => Promise.resolve(""));
  }
  if (typeof qz.security.setSignaturePromise === "function") {
    qz.security.setSignaturePromise(() => Promise.resolve(""));
  }
}

export function subscribeQzConnection(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getQzConnectionSnapshot(): QzConnectionSnapshot {
  return snapshot;
}

async function waitForQzLibrary(timeout = 5000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const qz = (window as any).qz;
    if (qz?.websocket?.connect) {
      return qz;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

export async function connectQzIfNeeded(): Promise<boolean> {
  // Wait for QZ library to load (CDN might be slow)
  const qz = await waitForQzLibrary();

  if (!qz) {
    setSnapshot({ status: "error", isConnected: false, error: "QZ Tray library not loaded. Install QZ Tray from qz.io" });
    return false;
  }

  setUpSecurityPromises(qz);

  // Check if already connected
  if (qz.websocket?.isActive?.()) {
    setSnapshot({ status: "connected", isConnected: true, error: null });
    return true;
  }

  // Prevent duplicate connection attempts
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const CONNECT_TIMEOUT_MS = 8000;

    const timeout = (ms: number) =>
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("QZ Tray connection timed out")), ms)
      );

    try {
      setSnapshot({ status: "connecting", isConnected: false, error: null });

      // Some environments never resolve/reject when QZ Tray isn't reachable.
      // Race with a timeout so UI doesn't get stuck on "Connecting...".
      await Promise.race([qz.websocket.connect(), timeout(CONNECT_TIMEOUT_MS)]);

      setSnapshot({ status: "connected", isConnected: true, error: null });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect to QZ Tray";

      const userMsg =
        msg.includes("timed out")
          ? "QZ Tray connection timed out. Please start QZ Tray and approve the connection prompt (if shown)."
          : msg.includes("Unable to connect")
            ? "QZ Tray is not running. Please start QZ Tray."
            : msg;

      setSnapshot({ status: "error", isConnected: false, error: userMsg });
      return false;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export async function initQzConnection(): Promise<void> {
  if (initialized) return;
  initialized = true;
  await connectQzIfNeeded();
}

export async function retryQzConnection(): Promise<boolean> {
  // Reset state to allow fresh connection attempt
  connectPromise = null;
  return connectQzIfNeeded();
}

export function isQzConnected(): boolean {
  const qz = (window as any).qz;
  return qz?.websocket?.isActive?.() ?? false;
}

