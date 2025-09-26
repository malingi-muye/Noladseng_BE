// Safe socket wrapper for the client.
// - If `socket.io-client` is installed, we use it.
// - If not, we provide a minimal in-memory mock so imports never fail in dev.

// Minimal socket-like interface used across the app
export interface MinimalSocket {
  on: (event: string, cb: (...args: any[]) => void) => void;
  off: (event: string, cb?: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  connected?: boolean;
}

// In-memory event registry for the mock implementation
const subscribers: Record<string, Set<(...args: any[]) => void>> = {};

// Start with a mock socket that works even without socket.io-client
const mockSocket: MinimalSocket = {
  on(event, cb) {
    (subscribers[event] ||= new Set()).add(cb);
  },
  off(event, cb) {
    if (!cb) {
      delete subscribers[event];
      return;
    }
    subscribers[event]?.delete(cb);
  },
  emit(event, ...args) {
    subscribers[event]?.forEach((fn) => fn(...args));
  },
  connected: false,
};

let singletonSocket: MinimalSocket = mockSocket;

// Attempt to dynamically load socket.io-client if available.
// This runs in the background; if it succeeds, we replace the mock with the real socket.
(async () => {
  try {
    // Dynamically import to avoid build-time resolution errors when package is missing
    const { io } = await import('socket.io-client');
    
    // Build a URL using the current page protocol (http/https) — socket.io-client prefers http(s) origins
    const pageProtocol = window.location.protocol; // 'http:' or 'https:'
    const host = window.location.hostname;

    // In development, the Vite Socket.IO server runs on port 5174.
    // Use import.meta.env.DEV to detect dev mode reliably.
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV;

    // Allow production disable via env flag
    const enableProdSocket = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_ENABLE_SOCKET) === 'true';

    // If in production and not explicitly enabled, keep using mock socket
    if (!isDev && !enableProdSocket) {
      if (typeof console !== 'undefined') {
        console.log('[Socket.IO] Disabled in production (set VITE_ENABLE_SOCKET=true to enable)');
      }
      return;
    }

    const socketUrl = isDev && window.location.hostname === 'localhost' ? `${pageProtocol}//${host}:5174` : `${pageProtocol}//${window.location.host}`;

    const real = io(socketUrl, {
      // allow polling first for environments where websockets are blocked
      transports: ['polling', 'websocket'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    // Add connection event handlers
    real.on('connect', () => {
      console.log('[Socket.IO] Connected to server');
    });

    real.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected from server:', reason);
    });

    real.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message);
    });

    real.on('reconnect', (attemptNumber) => {
      console.log('[Socket.IO] Reconnected after', attemptNumber, 'attempts');
    });

    real.on('reconnect_error', (error) => {
      console.warn('[Socket.IO] Reconnection error:', error.message);
    });

    real.on('reconnect_failed', () => {
      console.error('[Socket.IO] Failed to reconnect after maximum attempts');
    });

    // Replace methods with real socket methods while keeping the same reference
    // so consumers don't need to re-import
    singletonSocket.on = real.on.bind(real);
    singletonSocket.off = real.off.bind(real);
    singletonSocket.emit = real.emit.bind(real);

    Object.defineProperty(singletonSocket, 'connected', {
      get() {
        return (real as any).connected;
      },
      configurable: true,
    });
  } catch (err) {
    if (typeof console !== 'undefined' && (globalThis as any)?.import?.meta?.env?.DEV) {
      console.warn('[socket] socket.io-client not installed; using mock socket.');
    }
  }
})();

export function getSocket(): MinimalSocket {
  return singletonSocket;
}
