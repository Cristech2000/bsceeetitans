// sw.js - Firebase Cloud Messaging Service Worker

const CACHE_NAME = 'bsceee-v2-' + Date.now();

// Files to cache for offline use
// Files to cache for offline use
const FILES_TO_CACHE = [
    './',
    './index.html',
    './timetable.html',
    './announcements.html',
    './style.css',
    './manifest.json',
    './pngegg.png',
    './GALLERY/image-removebg-preview.png'
];

// Install event - cache important files
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app files');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache:', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
    );
});

// ========== FIREBASE CLOUD MESSAGING HANDLERS ==========

// Import Firebase Messaging scripts
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD3oMlsv9C3Qepvkw_Y1JVfhVJiMwZLox4",
    authDomain: "bsceee-webpage.firebaseapp.com",
    databaseURL: "https://bsceee-webpage-default-rtdb.firebaseio.com",
    projectId: "bsceee-webpage",
    storageBucket: "bsceee-webpage.appspot.com",
    messagingSenderId: "281106710079",
    appId: "1:281106710079:web:2c6ab931bc3cab8e4e428a",
    measurementId: "G-B1M7SSEZYP"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Announcement';
    const notificationOptions = {
        body: payload.notification?.body || 'Check the class website for updates',
        icon: 'pngegg.png',
        badge: 'pngegg.png',
        vibrate: [200, 100, 200],
        data: payload.data || {},
        tag: payload.data?.announcementId || 'general',
        requireInteraction: true
    };

    // Show notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event.notification);

    // Close the notification
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/announcements.html';

    // Focus or open the app
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clientList => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed:', event.notification);
});


