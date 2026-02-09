/**
 * Service Worker for Time & Attendance App
 * Provides offline support, push notifications, and background sync
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `time-attendance-${CACHE_VERSION}`;
const RUNTIME_CACHE = `time-attendance-runtime-${CACHE_VERSION}`;

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

/**
 * Install event - cache essential assets
 */
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event - network first, cache fallback
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external APIs
  if (request.method !== 'GET') {
    return;
  }

  // API requests: network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache on network failure
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets: cache first, network fallback
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }

      return fetch(request).then(response => {
        // Cache successful responses
        if (response.ok && request.method === 'GET') {
          const clonedResponse = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      });
    })
  );
});

/**
 * Push notification event
 */
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received');

  let notificationData = {
    title: 'Time & Attendance',
    message: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData.message = event.data.text();
    }
  }

  const options = {
    body: notificationData.message,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag || 'default',
    requireInteraction: notificationData.requireInteraction || false,
    data: notificationData.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  // Focus existing window if available
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

/**
 * Background sync event (for offline clock in/out)
 */
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync event:', event.tag);

  if (event.tag === 'sync-time-entries') {
    event.waitUntil(syncTimeEntries());
  }
});

/**
 * Sync pending time entries
 */
async function syncTimeEntries() {
  try {
    // Open IndexedDB to get pending entries
    const db = await openIndexedDB();
    const pendingEntries = await getPendingEntries(db);

    if (pendingEntries.length === 0) {
      console.log('[Service Worker] No pending entries to sync');
      return;
    }

    console.log(`[Service Worker] Syncing ${pendingEntries.length} pending entries`);

    // Sync each pending entry
    for (const entry of pendingEntries) {
      try {
        await syncEntry(entry);
        await removePendingEntry(db, entry.id);
      } catch (error) {
        console.error('[Service Worker] Error syncing entry:', error);
      }
    }

    // Notify clients of sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Time entries synced successfully',
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync error:', error);
    throw error;
  }
}

/**
 * Sync a single time entry
 */
async function syncEntry(entry) {
  // This would call your API to sync the entry
  // For now, just return a resolved promise
  return Promise.resolve();
}

/**
 * Open IndexedDB
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TimeAttendanceDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingEntries')) {
        db.createObjectStore('pendingEntries', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Get pending entries from IndexedDB
 */
function getPendingEntries(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingEntries'], 'readonly');
    const store = transaction.objectStore('pendingEntries');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Remove pending entry from IndexedDB
 */
function removePendingEntry(db, entryId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingEntries'], 'readwrite');
    const store = transaction.objectStore('pendingEntries');
    const request = store.delete(entryId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[Service Worker] Loaded successfully');
