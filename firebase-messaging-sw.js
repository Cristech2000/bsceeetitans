// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Your Firebase config (same as before)
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Announcement';
    const notificationOptions = {
        body: payload.notification?.body || 'Check the class website for updates',
        icon: './pngegg.png',  // ← Use relative path
        badge: './pngegg.png', // ← Use relative path
        data: payload.data || {}
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});