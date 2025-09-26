/**
 * Service Worker for Nolads Engineering
 * Provides offline support and caching strategy
 */

const CACHE_NAME = "nolads-engineering-v3";
const STATIC_CACHE = "static-v3";
const DYNAMIC_CACHE = "dynamic-v3";

// Files to cache immediately
const STATIC_FILES = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
  "/client/App.tsx",
  "/client/global.css",
];

// Note: API routes now handled by Supabase, no local /api caching needed

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static files");
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log("Service Worker: Static files cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Error caching static files", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      }),
  );
});

// Fetch event - refined routing to avoid caching HTML and ensure correct MIME for modules
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Never interfere with socket.io, API, or Supabase realtime
  if (
    url.pathname.startsWith("/socket.io/") ||
    url.pathname.startsWith("/api")
  ) {
    return;
  }

  // Never cache navigation requests (HTML). Use network-first with offline fallback
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  // Assets: prefer network, cache successful responses. Validate module/script MIME types
  if (
    url.pathname.startsWith("/assets/") ||
    request.destination === "script" ||
    request.destination === "worker"
  ) {
    event.respondWith(networkFirstAssetWithMimeGuard(request));
    return;
  }

  // Uploaded/static media: cache-first is fine
  if (url.pathname.startsWith("/uploads/") || request.destination === "image") {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first then cache
  event.respondWith(networkFirst(request));
});

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("Cache First Strategy Error:", error);

    // Return offline page for navigation requests
    if (request.destination === "document") {
      return caches.match("/offline.html");
    }

    throw error;
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("Network First Strategy Error:", error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response for API requests
    return new Response(
      JSON.stringify({
        error: "Network error",
        message: "Please check your connection and try again",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Network-first just for documents (HTML), with offline fallback
async function networkFirstDocument(request) {
  try {
    const networkResponse = await fetch(request);
    // Do not cache HTML to avoid stale index.html or route HTML
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match("/offline.html");
    if (cachedResponse) return cachedResponse;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

// Network-first for assets/scripts with MIME/type guard to avoid cached HTML response
async function networkFirstAssetWithMimeGuard(request) {
  try {
    const response = await fetch(request);
    const contentType = response.headers.get("content-type") || "";
    const isModuleScript = request.destination === "script" || request.destination === "worker";

    // If a script/worker returns HTML, treat as invalid (likely a 404 fallback page)
    if (isModuleScript && contentType.includes("text/html")) {
      // Do not cache this bad response; try cache as fallback
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response("Bad module MIME", { status: 502, statusText: "Bad Gateway" });
    }

    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any pending offline actions
    console.log("Service Worker: Performing background sync");

    // Example: Sync offline form submissions
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      for (const data of offlineData) {
        try {
          await fetch(data.url, {
            method: data.method,
            headers: data.headers,
            body: data.body,
          });
          await removeOfflineData(data.id);
        } catch (error) {
          console.error("Background sync error:", error);
        }
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Push notification handling
self.addEventListener("push", (event) => {
  const options = {
    body: event.data
      ? event.data.text()
      : "New notification from Nolads Engineering",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
        icon: "/favicon.ico",
      },
      {
        action: "close",
        title: "Close",
        icon: "/favicon.ico",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Nolads Engineering", options),
  );
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Utility functions for offline data management
async function getOfflineData() {
  // Implementation for storing/retrieving offline data
  // This would typically use IndexedDB or localStorage
  return [];
}

async function removeOfflineData(id) {
  // Implementation for removing offline data
  console.log("Removing offline data:", id);
}

// Message handling for communication with main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log("Service Worker: Loaded");
