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
    
    // Get the current hostname and protocol for proper WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // In development, use port 5174 for Socket.IO server
    const isDev = window.location.hostname === 'localhost' && window.location.port === '5173';
    const socketUrl = isDev ? `${protocol}//${window.location.hostname}:5174` : `${protocol}//${host}`;
    
    const real = io(socketUrl, { 
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
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
