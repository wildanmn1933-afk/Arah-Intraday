# AGENTS.md

Repo knowledge for ArahMarket 2.0 (market intelligence platform).

## Stack
- Frontend: React 19 + Vite 8 + Tailwind v4 (`@import "tailwindcss"` in `src/index.css`, no `tailwind.config.js`).
- Backend: Express + TypeScript, run via `tsx`. Data store is `data/market_intelligence.db.json`.
- AI: `@google/genai` (Gemini) in `server/intelligence/gemini.ts`.

## Commands
- Install: `npm install --legacy-peer-deps` (esbuild@0.25 vs vite@8 peer conflict).
- Dev (server + Vite): `npm run dev` -> http://localhost:3000.
- Type-check: `npx tsc --noEmit`.
- Build: `npx vite build`.

## Conventions
- UI language is Indonesian. Keep terminology consistent: domain terms stay as-is (Intermarket, Makro, G8, DXY, AI), everything else Indonesian. Do not mix both languages in one label.
- Nav labels come from `src/lib/navLabels.ts` (`NAV_LABELS` / `getNavLabel`) — Sidebar and Header both read from it. Never re-add a local label map.
- Enum values (e.g. `LOOK_FOR_SELL`, `NEW_YORK`) are identifiers, not UI copy. Never render them directly — map via a local `Record<string,string>` (see `ACTION_LABELS` / `SESSION_LABELS` in `src/components/ArahMarketView.tsx`) and fall back to the raw value.
- Asset lists come from `shared/canonicalAssets.ts` (`CANONICAL_ASSETS`, `findAsset`, `getAssetCategory`, `getAssetDisplayName`). Adding an instrument means editing only that file.
- All financial numbers use `font-mono`; `src/index.css` applies `tabular-nums` to it globally.
- Design tokens live in the `@theme` block of `src/index.css` (fonts, `--text-2xs`, `--shadow-panel`).

## Gotchas
- Market price feed stores FX as single currency codes (`EUR`, `GBP`, `JPY`, `AUD`, `CAD`, `CHF`), NOT pair names. Anything looking up `EURUSD`/`USDJPY` in `db.getAllMarketPrices()` will get nothing and render `0.00`. Use an explicit price-symbol mapping — `CanonicalAsset.pair` is the bridge between UI pair name and feed code.
- Tailwind v4 has no `slate-750` / `slate-850`. They are defined manually in `@theme`; without that, those classes silently emit no CSS (broken borders and hovers). Check the built CSS if a border or hover "does nothing".
- `ArahMarketEngine` (`server/intelligence/arahMarketEngine.ts`) filters `CANONICAL_ASSETS` down to the 10 intraday instruments; the 14-asset `intradayMarketMap.ts` covers everything. Both read the same registry, so they cannot diverge.
- The shared `shared/` directory is imported by both client and server code; server-side importers use a `.js` extension (NodeNext), client-side importers do not.
- `data/market_intelligence.db.json` is rewritten by the dev server on every ingest (timestamps, new news rows). Stop `tsx server.ts` before committing DB string edits, or the diff fills with unrelated runtime churn. Files with emoji contain lone surrogates — read/write with `errors='surrogatepass'`, not plain `json.load`/`json.dump`.
- Auth: dashboard requires a JWT. Tokens come from `POST /api/auth/login`; seeded admin is `admin@marketintel.pro`.
- Browser-automation caveat: synthetic `type`/`click` via tooling can fail to dispatch React's `onChange`, so controlled inputs re-render empty and forms submit with blank state. Verify form flows over HTTP (`POST /api/auth/login` + `GET /api/auth/me`) instead of concluding the UI is broken. Note `localStorage` is not cleared by setting an empty origins list — blank each token value explicitly (`arah_market_auth_token`, `nexus_auth_token`, `auth_token`) to test the unauthenticated path.
