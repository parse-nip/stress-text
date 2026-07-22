# AGENTS.md

## Cursor Cloud specific instructions

Telegram Wrapped is a **client-only** React + TypeScript + Vite single-page app (no backend, no database, no auth). All chat parsing and stat computation run in the browser; nothing is uploaded. There is exactly one service to run: the Vite dev server.

Standard commands live in `README.md` and `package.json` `scripts` (`dev`, `build`, `lint`, `test`, `preview`, `deploy`). Notes that aren't obvious from those:

- **Dev server**: `npm run dev` serves on `http://localhost:5173/`. It binds to localhost only (no `--host`).
- **Lint**: `npm run lint` uses `oxlint`. A single `react(only-export-components)` warning in `src/components/cards.tsx` is pre-existing and non-blocking.
- **Test**: `npm run test` is a single smoke test (`tsx src/lib/computeStats.test.ts`) over demo data — not a full test runner. It prints computed stats and exits 0 on success.
- **Build**: `npm run build` runs `tsc -b` (project-references typecheck) then `vite build` into `dist/`.
- **Manual testing without a real export**: use the "Try a demo chat" button on the landing screen, then pick a participant and a time window ("All time" is the quickest path to populated cards) to swipe through the story cards.
- **Deploy** (`npm run deploy` → Cloudflare Workers) is only for the production target `wrapped.popped.dev` and needs `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`. Not required for local development.
