# Born & Buried

A historical-figure guessing game. You see a world map with two pins — where a
figure was **born** and where they **died**, each labeled with a year — and you
guess **who** it is from a searchable combobox. 10 rounds, 3 strikes, one guess
per round, with a per-round timer and time bonus.

**Stack:** Next.js (App Router) · Convex · Clerk · shadcn/ui on Base UI ·
MapLibre GL via `react-map-gl` (free OpenFreeMap tiles, no key).

The current round's answer **never reaches the client**: Convex stores the
ordered answer list server-side and only sends sanitized round data (two
coordinates + years + category). Guesses are checked server-authoritatively.

---

## Setup (one-time)

You need a free [Convex](https://convex.dev) account and a free
[Clerk](https://clerk.com) account.

### 1. Convex

```bash
pnpx convex dev
```

First run is interactive: log in (or pick "try Convex locally without an
account"), then create/choose a project. This generates `convex/_generated/`,
pushes the schema + functions, and writes `CONVEX_DEPLOYMENT` +
`NEXT_PUBLIC_CONVEX_URL` into `.env.local`. **Leave this running** (it watches
backend files and keeps the dev deployment in sync).

### 2. Clerk + Convex JWT

1. Create a Clerk application at <https://dashboard.clerk.com/apps/new>.
2. Activate the **Convex** integration at
   <https://dashboard.clerk.com/apps/setup/convex> (this creates the JWT
   template named `convex`). Copy the **Frontend API URL** shown there.
3. Copy your keys from <https://dashboard.clerk.com/last-active?path=api-keys>.
4. Fill `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_JWT_ISSUER_DOMAIN=https://your-frontend-api.clerk.accounts.dev
   ```
5. Tell the Convex backend the issuer (it reads this, not `.env.local`):
   ```bash
   pnpx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-frontend-api.clerk.accounts.dev
   ```

### 3. Seed the figures (~19 across categories)

```bash
pnpx convex run seed:run
```

### 4. Run the app

In a second terminal (keep `pnpx convex dev` running in the first):

```bash
pnpm dev
```

Open <http://localhost:3000>.

---

## How it works

- `convex/schema.ts` — `figures`, `users`, `gameSessions`, `scores` (+ indexes).
- `convex/games.ts` — `startGame`, `getCurrentRound` (sanitized), `submitGuess`
  and `submitTimeout` (server computes elapsed time from `roundStartedAt`, so a
  spoofed client clock can't earn a bigger bonus or dodge a timeout).
- `convex/figures.ts` — `listForCombobox` returns only names/aliases/ranking,
  **never geography or years**.
- `convex/leaderboard.ts` — `submitScore` is auth-gated
  (`ctx.auth.getUserIdentity()`) and idempotent; `topScores` / `myHistory`.
- `convex/scoring.ts` — base 1000 + time bonus `(remaining/roundSeconds)*500` +
  streak multiplier (+10%/consecutive, capped at +100%).

Guest play is fully supported; signing in (Clerk) is required only to save a
score to the leaderboard. A guest can finish a game, then sign in from the end
screen, and the same session's score is saved.

## Adding more figures

Append entries to `convex/seedData.ts`, then re-run `pnpx convex run seed:run`
(insertion is idempotent on `slug`).
