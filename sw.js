const CACHE_NAME = 'mirzapur-mandal-dynamic-v1';

// 1. Install Event: नया सर्विस वर्कर आते ही तुरंत एक्टिवेट हो जाए
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 2. Activate Event: पुराने फालतू कैशे को डिलीट करना और तुरंत कंट्रोल लेना
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: "Network First, Fallback to Cache" रणनीति
self.addEventListener('fetch', event => {
  // Google Apps Script (API) और POST रिक्वेस्ट को कैशे नहीं करना है
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // अगर इंटरनेट चल रहा है और सही रिस्पॉन्स मिला, तो उसकी कॉपी कैशे में अपडेट कर लें
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse; // हमेशा सबसे ताज़ा (Latest) कोड दिखाएं
      })
      .catch(() => {
        // अगर इंटरनेट बंद है (Offline), तो कैशे से पुरानी फाइल दिखा दें
        return caches.match(event.request);
      })
  );
});
