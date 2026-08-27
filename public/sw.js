const CACHE_NAME = 'gameverse-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/game-art/bubble-shooter.svg',
  '/game-art/cartoon-brain.png',
  '/game-art/cartoon-bubble.png',
  '/game-art/cartoon-runner.png',
  '/game-art/cartoon-snake.png',
  '/game-art/checkers.svg',
  '/game-art/chess.svg',
  '/game-art/connect-four.svg',
  '/game-art/game-2048.svg',
  '/game-art/hangman.svg',
  '/game-art/ludo.svg',
  '/game-art/memory-match.svg',
  '/game-art/number-guess.svg',
  '/game-art/reaction-time.svg',
  '/game-art/rock-paper-scissors.svg',
  '/game-art/snake.svg',
  '/game-art/snakes-and-ladders.svg',
  '/game-art/sudoku.svg',
  '/game-art/target-hitter.svg',
  '/game-art/tictactoe.svg',
  '/game-art/trivia-quiz.svg',
  '/game-art/typing-test.svg',
  '/game-art/whack-a-mole.svg',
  '/game-art/word-guess.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') return networkResponse;
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return networkResponse;
      }).catch(() => {
        // Only navigation requests get the app-shell fallback. Missing images stay images,
        // so a failed asset can never be replaced with index.html.
        if (event.request.mode === 'navigate') return caches.match('/');
        return new Response('', { status: 504, statusText: 'Offline asset unavailable' });
      });
    })
  );
});
