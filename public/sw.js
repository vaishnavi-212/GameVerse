// GameVerse service worker
// Keep offline support for static artwork, but always prefer the latest deployed app.
const CACHE_NAME = 'gameverse-static-v4';
const OFFLINE_ASSETS = [
  '/manifest.webmanifest',
  '/logo.png',
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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const url = new URL(request.url);

  // Never intercept Supabase/API calls.
  if (url.origin !== self.location.origin) return;

  // HTML/app navigations are always network-first. This prevents an old cached
  // index.html from pointing at deleted Vite bundles after a Vercel deployment.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => caches.match('/'))
    );
    return;
  }

  // Vite JS/CSS bundles are deployment-versioned. Always fetch them from the
  // network instead of storing runtime copies that can become mismatched.
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html')) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first only for the known static artwork needed for offline play.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok && url.pathname.startsWith('/game-art/')) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
