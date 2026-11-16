# Cờ Tướng Online — Next.js 15 (App Router) + Tailwind 4 + Firebase

1. `cp .env.example .env.local` and fill in the Firebase web config + Admin service account.
2. Firebase console: enable Auth (Google + Email/Password), create Firestore, deploy `firestore.rules`.
3. Create composite index when prompted: `rooms` → `isQuick` ASC, `status` ASC, `createdAt` ASC.
4. `npm i && npm run dev`

Design: clients only READ Firestore (live `onSnapshot`). Every write that matters (join, move, resign,
draw, timeout, Elo/karma) goes through `/api/*` using Firebase Admin, so rules and clocks are validated
server-side with the same `xiangqi.js` engine.
