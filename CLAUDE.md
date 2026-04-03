# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interview challenge: Next.js 14 frontend (`:3000`) + Express/TypeScript backend (`:8080`) with SQLite. Users register, log in, add friends, and view their friend network up to 3rd degree connections (BFS graph traversal).

## Commands

### Frontend (root directory)
```bash
npm run dev          # Start frontend on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

### Backend (server/ directory)
```bash
cd server
npm run dev          # Start backend with hot-reload (tsx watch) on localhost:8080
npm run build        # TypeScript compile (tsc) to dist/
npm test             # Run all tests (vitest)
npm run test:watch   # Watch mode
npx vitest run tests/auth.test.ts    # Single test file
```

### Docker
```bash
docker compose up --build   # Backend on :8080 with persistent SQLite volume
```

## Architecture

**Frontend** (`app/`): Next.js App Router. React Query for data fetching, Zod for response validation. All API calls use `credentials: 'include'` for cookie auth. API origin configured via `NEXT_PUBLIC_API_ORIGIN` in `next.config.mjs`.

**Backend** (`server/src/`): Express app exported via `createApp(dbPath?)` for testability. SQLite via better-sqlite3 (synchronous). Session-based auth with UUID tokens stored in a `sessions` table, delivered as httpOnly cookies.

**Key backend files:**
- `index.ts` — App factory, middleware chain (pino-http → CORS → cookie-parser → JSON → rate-limit → routes → error handler), graceful shutdown
- `db.ts` — SQLite init, schema creation (users, sessions, friendships tables), WAL mode
- `config.ts` — Centralized env-var config (port, CORS origin, session TTL, bcrypt rounds)
- `middleware/auth.ts` — Session validation + expiry check, attaches `req.user`
- `routes/friends.ts` — BFS traversal up to depth 3 for degree calculation; bidirectional friendships via transaction with `INSERT OR IGNORE`

**API contract** (defined in README.md):
- Error responses: `{ error: true, message: string }` — frontend Zod-validates this
- `GET /v1/friends` returns `[{ name, email, degree: "1st"|"2nd"|"3rd" }]` — degree is a string enum, not a number
- Success responses for POST endpoints need no body (just 200)
- `GET /v1/profile` returns `{ id, email, name }` — `id` must be a string (frontend casts it)

## Testing

Vitest + Supertest. Tests use in-memory SQLite (`:memory:`) via `createTestApp()`. Helper functions `registerUser()` and `loginUser()` in `tests/helpers.ts` return session cookie strings. `tests/setup.ts` closes DB after each test to prevent leaks.

Globals enabled in vitest config — no need to import `describe`/`it`/`expect`.

## Key Patterns

- Emails are normalized with `.trim().toLowerCase()` on all paths (register, login, friend lookup)
- Friendships are always bidirectional — both `(A,B)` and `(B,A)` inserted in a transaction
- The `insertFakeData.ts` in the frontend registers 100 users and creates a sparse friend graph; some 400 errors during this are expected (users randomly self-friend)
- CORS is locked to `http://localhost:3000` with `credentials: true`
