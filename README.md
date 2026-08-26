# GameVerse

**Play what the moment feels like.**

GameVerse is an offline-first mini-game collection. Personal gameplay data stays primarily on the player's device, while only minimal anonymous usage measurement is synchronized to Supabase.

## Privacy model

### Stored locally

- Detailed high scores and personal records
- Favourite games
- Recently played games
- Preferences
- Personal play counts and gameplay history
- Pending anonymous usage events

`localStorage` stores simple preferences and personal summary data. `IndexedDB` stores pending anonymous sync events.

### Stored in the cloud

Only minimal anonymous usage data:

- Random anonymous UUID
- First/last activity timestamps
- App session timestamps
- Game name and aggregate session timing
- Whether a game session began/ended while offline

No name, email, phone number, account, or detailed personal PlaySpace data is collected.

The same browser reuses its existing anonymous UUID, so returning users do not create another unique-user record.

## Run locally

```bash
npm install
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase_schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Restart the Vite server.

## Offline sync

When offline, personal data is saved locally and anonymous usage events are queued in IndexedDB. When the network returns, GameVerse syncs pending events to Supabase and marks them as complete.

## Deploy to Vercel

Set these environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Build command: `npm run build`

Output directory: `dist`
