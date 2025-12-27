// Global, singleton QZ Tray connection manager.
// Ensures qz.websocket.connect() is invoked at most once for the entire app lifecycle.

export type QzConnectionStatus = "idle" | "connecting" | "connected" | "error";

export type QzConnectionSnapshot = {
  status: QzConnectionStatus;
  isConnected: boolean;
  error: string | null;
};

let snapshot: QzConnectionSnapshot = {
  status: "idle",
  isConnected: false,
  error: null,
};

const listeners = new Set<() => void>();
let connectPromise: Promise<boolean> | null = null;
let initialized = false;

function emit() {
  for (const l of listeners) l();
}

function setSnapshot(next: Partial<QzConnectionSnapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

function setUpSecurityPromises(qz: any) {
  if (!qz?.security) return;

  // Optional: structure for certificate/signature signing (required for silent trust in production).
  // For now, return empty strings to reduce repeated "Failed to get certificate" warnings during dev.
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

export async function connectQzIfNeeded(): Promise<boolean> {
  const qz = (window as any).qz;

  if (!qz) {
    setSnapshot({ status: "error", isConnected: false, error: "QZ Tray library not loaded" });
    return false;
  }

  setUpSecurityPromises(qz);

  if (qz.websocket?.isActive?.()) {
    if (snapshot.status !== "connected" || snapshot.isConnected !== true) {
      setSnapshot({ status: "connected", isConnected: true, error: null });
    }
    return true;
  }

  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      setSnapshot({ status: "connecting", isConnected: false, error: null });
      await qz.websocket.connect();
      setSnapshot({ status: "connected", isConnected: true, error: null });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect to QZ Tray";
      setSnapshot({ status: "error", isConnected: false, error: msg });
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
  // Allow manual retry even if previously initialized
  return connectQzIfNeeded();
}

export function isQzConnected(): boolean {
  const qz = (window as any).qz;
  return qz?.websocket?.isActive?.() ?? false;
}

