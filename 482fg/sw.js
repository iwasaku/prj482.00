const CACHE_NAME = '482-fighter-v2';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/sound.js',
  './js/hitbox.js',
  './js/gamepad.js',
  './js/fighter.js',
  './js/characters.js',
  './js/stages.js',
  './js/select.js',
  './js/scenes.js',
  './js/main.js',
  './assets/spritesheet/fighter.json',
  './favicon/android-chrome-192x192.png',
  './favicon/android-chrome-512x512.png',
  './favicon/apple-touch-icon.png',
  './favicon/favicon-16x16.png',
  './favicon/favicon-32x32.png',
  './assets/image/char_asumi.png',
  './assets/image/char_bunbun.png',
  './assets/image/char_midare.png',
  './assets/image/char_murata.png',
  './assets/image/char_yasui.png',
  './assets/image/stage_dojo.png',
  './assets/image/stage_night.png',
  './assets/image/stage_noon.png',
  './assets/image/stage_rain.png',
  './assets/image/stage_sunset.png',
  './assets/sound/block.mp3',
  './assets/sound/dash.mp3',
  './assets/sound/draw.mp3',
  './assets/sound/fight.mp3',
  './assets/sound/hadou.mp3',
  './assets/sound/hit.mp3',
  './assets/sound/hit_heavy.mp3',
  './assets/sound/jump.mp3',
  './assets/sound/ko.mp3',
  './assets/sound/land.mp3',
  './assets/sound/p1_win.mp3',
  './assets/sound/p2_win.mp3',
  './assets/sound/round1.mp3',
  './assets/sound/round2.mp3',
  './assets/sound/round3.mp3',
  './assets/sound/shoryu.mp3',
  './assets/sound/tatsu.mp3',
  './assets/sound/tech.mp3',
  './assets/sound/throw.mp3',
  './assets/sound/timeover.mp3',
  './assets/sound/ui_move.mp3',
  './assets/sound/ui_ok.mp3',
  './assets/sound/ui_ready.mp3',
  './assets/sound/whoosh.mp3',
  './assets/sound/whoosh_heavy.mp3',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE_NAME;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(req, copy);
        });
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return undefined;
      });
    })
  );
});
