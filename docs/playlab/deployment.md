# Deployment & Hosting Guide — Si-Cehat PlayLab Web Game

## 1. Static SPA Architecture
`si-cehat-game-web` is built as a pure client-side single-page application (SPA). It produces zero server-side state, making it deployable on any modern static web host or CDN:
- Cloudflare Pages
- Vercel / Netlify
- AWS S3 + CloudFront
- Serving statically via Hono backend `serveStatic({ root: "./dist" })`

## 2. Production Build
Execute:
```bash
bun run build
```
This generates the optimized bundle in `./dist`:
- `index.html` (Entry HTML)
- `assets/index-[hash].js` (Vite application bundle)
- `assets/index-[hash].css` (Tailwind styles)

## 3. Dedicated Origin Hardening
For production security:
1. Deploy the web game to a dedicated trusted origin, e.g., `https://games.sicehat.id`.
2. Do **not** mix arbitrary third-party content onto this domain.
3. In Flutter, update `ApiConstants.gameWebUrl` to point to `https://games.sicehat.id`.
4. The Flutter WebView `onNavigationRequest` will reject navigation to any domain outside this allowlist.

## 4. Cache & Version Pinning for Studies
During an ongoing research study or evaluation:
1. Version identifiers (`version: "1.0.0"`, `rulesVersion: "1.0.0"`) must be pinned.
2. Invalidate CDN caches when deploying a new version, or append version queries.
3. Every session record stores immutable version tags so participants can be compared consistently.

## 5. Rollback Procedures
Because the application is static:
1. Re-deploy the previous Git release tag commit or previous static artifact bundle.
2. The backend remains backward-compatible with versioned rulesets (`FOOD_ITEMS_MAP` and `KNOWLEDGE_KEY`).
