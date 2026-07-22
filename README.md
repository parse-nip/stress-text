# Telegram Wrapped

Spotify Wrapped energy for a Telegram chat — **content-blind**, timing-and-chaos only.

Drop a Telegram Desktop JSON export, pick who you are, and swipe through story-style cards: reply speed, night-owl %, daily streaks, double-texts, emoji royalty, badges, and a shareable summary grid.

## Quick start

```bash
npm install
npm run dev
```

Then open the app and either:

- **Try a demo chat**, or
- Export a real chat from **Telegram Desktop** → chat menu → **Export chat history** → format **JSON** → drop `result.json` in.

Nothing is uploaded. Parsing and stats run entirely in your browser.

## What you get

**Timing & rhythm** — avg reply time, longest left-on-read, late-night %, daily streak, prime time, who opens the day  

**Volume & balance** — message counts, double-text streaks, one-sided days, voice notes, media, word counts  

**Chaos metadata** — `!` counts, ALL CAPS, edits, top emoji, longest message, the comeback gap  

**Badges** — Fastest replier, Night owl, Essay writer, Streak master, Most reliable opener  

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npx tsx src/lib/computeStats.test.ts` | Smoke-test the stats engine on demo data |

## Deploy (Cloudflare)

Production target: **https://wrapped.popped.dev**

```bash
npm run deploy
```

Requires `CLOUDFLARE_API_TOKEN` (Workers + DNS edit for `popped.dev`) and usually `CLOUDFLARE_ACCOUNT_ID`. The Worker serves the Vite `dist/` assets and attaches the `wrapped.popped.dev` custom domain via `wrangler.jsonc`.

GitHub Actions (`.github/workflows/deploy.yml`) deploys on push to `main` once those secrets are set on the repo.

