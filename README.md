# Cờ Tướng Online — Next.js 15 (App Router) + Tailwind 4 + Firebase

1. `cp .env.example .env.local` and fill in the Firebase web config + Admin service account.
2. Firebase console: enable Auth (Google + Email/Password), create Firestore, deploy `firestore.rules`.
3. Create composite index when prompted: `rooms` → `isQuick` ASC, `status` ASC, `createdAt` ASC.
4. `npm i && npm run dev`

Design: clients only READ Firestore (live `onSnapshot`). Every write that matters (join, move, resign,
draw, timeout, Elo/karma) goes through `/api/*` using Firebase Admin, so rules and clocks are validated
server-side with the same `xiangqi.js` engine.

## AI opponent: Pikafish (WebAssembly)

The `/ai` page plays against [Pikafish](https://github.com/official-pikafish/Pikafish) running in the browser
through the [`pikafish-js`](https://www.npmjs.com/package/pikafish-js) package, inside a Web Worker.
`npm install` copies the worker to `public/engine/engine.worker.js`. The engine files themselves are **not** in
the npm package; add them under `public/engine/` (or host them elsewhere and set `NEXT_PUBLIC_PIKAFISH_BASE`):

```
public/engine/
  engine.worker.js        (copied automatically by `npm install`)
  pikafish.nnue           (network, 12–50 MB; must match the WASM build's feature width)
  threads-simd/pikafish.js   + pikafish.wasm
  single-simd/pikafish.js    + pikafish.wasm
  single-nosimd/pikafish.js  + pikafish.wasm
```

Get them from the `pikafish-js` project's release assets (or build them, see its README) and keep the network
and the WASM builds from the same variant. Optionally set `NEXT_PUBLIC_PIKAFISH_NET_SHA256` to verify and cache
the network in the browser.

- **Cross-origin isolation:** Pikafish needs `SharedArrayBuffer`, so `next.config.mjs` sends COOP/COEP headers for
  the `/ai` routes only (COOP on the whole site would break the sign-in popups). The page reloads once if it was
  reached by client-side navigation.
- **Fallback:** if the page can't be isolated (e.g. Safari) or the engine files are missing, the previous
  built-in minimax AI plays instead, and the page says so.
- **Licensing:** `pikafish-js` is AGPL-3.0-or-later, Pikafish is GPL-3.0 and the NNUE network has its own
  terms (non-commercial restrictions). Check these against this project's MIT license before deploying.
