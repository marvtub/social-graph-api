# Can a Semi-Technical Agentic Engineer Pass a Backend Coding Test?

## The Experiment

This repo is the result of a deliberate experiment: **can a semi-technical engineer, armed with AI coding agents, pass a backend engineering interview challenge?**

The answer: yes, and the result arguably exceeds the reference solution written by the team that designed the test.

### The Setup

- **The challenge**: Build a backend server (Node.js, port 8080) that interfaces with a provided Next.js frontend. Part 1: user registration, login, and profile. Part 2: a friends system with LinkedIn-style 1st/2nd/3rd degree connections via BFS.
- **The candidate**: A semi-technical agentic engineer -- not a backend developer by trade.
- **The tools**:
  - [Claude Code](https://claude.ai/claude-code) as the primary coding agent, with a custom review skill and systematic debugging skill
  - [OpenAI Codex CLI](https://github.com/openai/codex) invoked through Claude Code to challenge plans and code reviews (adversarial cross-checking)
  - A Pi Agent with a custom agent harness to build and implement most of the actual code
- **Time spent**: ~30 minutes to read requirements and build the complete solution (Part 1 + Part 2). Another ~30 minutes for security hardening and production best practices beyond the requirements.

### The Reference Solution

The team's own reference solution lives at [lindy-ai/interview-solution-identity-management](https://github.com/lindy-ai/interview-solution-identity-management). It was written by a human engineer as the expected answer.

---

## Detailed Comparison

### Completeness

| Requirement | This Solution (AI-Assisted) | Reference Solution (Human) |
|---|---|---|
| POST /v1/auth/register | Yes | Yes (as /v1/signup) |
| POST /v1/auth/login | Yes | Yes |
| GET /v1/profile | Yes | Yes |
| POST /v1/friends/add | Yes | **Not implemented** |
| GET /v1/friends (BFS) | Yes | **Not implemented** |

The reference solution only covers Part 1 (auth + profile). It does not implement Part 2 (the friends system with degree-based BFS), which is arguably the more interesting algorithmic part of the challenge.

### Architecture

| Aspect | This Solution | Reference Solution |
|---|---|---|
| Project structure | Multi-file: config, db, logger, middleware, routes | Single file (~125 lines) |
| Database | SQLite via better-sqlite3 (persistent, zero-infrastructure) | MongoDB via Mongoose (requires running instance) |
| Body parsing | express.json() (matches frontend Content-Type) | multer (FormData -- mismatches frontend which sends JSON) |
| TypeScript | Strict mode | Standard |
| Lines of server code | ~350 across 8 files | ~125 in 1 file |

### Authentication & Security

| Aspect | This Solution | Reference Solution |
|---|---|---|
| Session mechanism | UUID token stored in DB sessions table | Raw MongoDB `_id` stored directly in cookie |
| Session expiry | 24h server-side + cookie maxAge | None |
| Logout | Yes (POST /v1/auth/logout, idempotent) | Not implemented |
| Cookie config | httpOnly, sameSite=lax, maxAge, path=/ | httpOnly, sameSite=lax, secure=false, domain=localhost |
| Password hashing | bcryptjs (10 rounds) | bcrypt (10 rounds) |
| Login errors | Generic "Invalid email or password" (no enumeration) | Same |
| Rate limiting | 120 req/min on auth endpoints | None |
| Log redaction | Session cookies redacted from pino-http logs | No logging |
| Error format | `{ error: true, message }` matching frontend Zod schema | Plain text strings (would fail frontend error parsing) |
| Race conditions | SQLite UNIQUE constraint catch on duplicate email | No handling (MongoDB unique index would throw unhandled) |

**Security note**: The reference solution stores the raw MongoDB user `_id` directly in the cookie. Anyone who knows or guesses a user's `_id` can impersonate them -- there's no session token or server-side validation beyond a DB lookup. This solution uses random UUID session tokens stored in a separate sessions table, so cookie values are unpredictable and revocable.

### Friends System (Part 2)

The reference solution does not implement Part 2. This solution includes:

- **Bidirectional friendships**: INSERT OR IGNORE in both directions within a transaction
- **BFS with degree labels**: Level-by-level BFS batching queries per depth level with `WHERE user_id IN (...)` 
- **Cycle handling**: Visited set initialized with the requesting user to prevent infinite loops and self-inclusion
- **Deduplication**: BFS naturally shows shortest path (1st degree wins over 2nd if both paths exist)
- **Idempotent friend-add**: Adding the same friend twice returns 200 (no error)
- **Self-friend prevention**: Route-level check prevents users from adding themselves

### Testing

| | This Solution | Reference Solution |
|---|---|---|
| Test framework | Vitest + Supertest | None (`"test": "echo \"Error: no test specified\" && exit 1"`) |
| Test count | 24 passing tests | 0 |
| Coverage | Auth (register, login, validation, duplicates), profile (auth, unauthorized), friends (add, self-friend, idempotent, degrees, bidirectional, cycles, dedup, auth) | -- |
| Test infrastructure | In-memory SQLite via createApp(":memory:"), per-test DB isolation | -- |

### Production Readiness

| Aspect | This Solution | Reference Solution |
|---|---|---|
| Structured logging | pino + pino-http (JSON, request IDs, timing) | None (no logging at all) |
| Environment config | PORT, CORS_ORIGIN, BCRYPT_ROUNDS, SESSION_MAX_AGE_MS, LOG_LEVEL | All hardcoded |
| Graceful shutdown | SIGTERM/SIGINT handlers, close server + DB | None |
| Docker | Multi-stage Dockerfile + docker-compose with persistent volume | None |
| Health check | GET /v1/health | GET / returns "Hello World" |
| DB migrations | ALTER TABLE migration for schema evolution | N/A (schemaless MongoDB) |
| Global error handler | Respects err.status (400 for parse errors, 500 for server errors) | None |
| 404 handler | Returns JSON `{ error: true, message: "Not found" }` | Express default HTML |

### Error Response Compatibility

The frontend's error parser (`app/lib/errors.ts`) validates error responses with Zod:

```ts
const errorResponse = z.object({
    error: z.literal(true),
    message: z.string(),
})
```

- **This solution**: All errors return `{ error: true, message: "..." }` -- matches the schema
- **Reference solution**: Returns plain text like `"Email and password are required."` -- would fail Zod parsing and show "An unexpected error occurred" on every error

---

## The Agentic Workflow

The workflow that produced this solution:

1. **Requirements analysis** (~5 min): Claude Code scanned the README and all frontend source files to extract the exact API contract, including response schemas, cookie behavior, error formats, and the insertFakeData flow.

2. **Planning** (~5 min): Claude Code designed the architecture (Express + SQLite + BFS) and I reviewed the plan, choosing SQLite over in-memory storage for persistence.

3. **Implementation** (~15 min): A Pi Agent with a custom harness built the server code, routes, middleware, BFS algorithm, and tests.

4. **Cross-validation** (~5 min): OpenAI Codex CLI was invoked through Claude Code to independently review the implementation against the README spec. It caught two issues (race condition on register, session cookie behavior during fake data insertion).

5. **Security hardening** (~15 min): Added rate limiting, session expiry, logout, structured logging, environment config, and graceful shutdown.

6. **Review and fixes** (~15 min): Both Claude Code and Codex reviewed the hardened code. Fixed: pino logger arg order (build blocker), circular import, global error handler status codes, cookie header redaction, cookie maxAge, idempotent logout, and a SQLite migration for the `created_at` column.

### Tools Used

| Tool | Role |
|---|---|
| **Claude Code** (Claude Opus 4.6) | Primary agent: planning, code review, debugging, implementation guidance |
| **OpenAI Codex CLI** (GPT-5.4) | Adversarial reviewer: independently challenged Claude's plans and code |
| **Pi Agent** (custom harness) | Implementation: wrote most of the actual server code |
| **Custom review skill** | Structured code review against requirements |
| **Systematic debugging skill** | Root cause analysis for runtime issues |

---

## Summary

| Metric | This Solution | Reference Solution |
|---|---|---|
| Challenge completion | Part 1 + Part 2 | Part 1 only |
| Tests | 24 | 0 |
| Security | Session tokens, expiry, rate limiting, log redaction | Raw user ID in cookie |
| Error compatibility | Matches frontend Zod schema | Plain text (breaks frontend) |
| Production features | Logging, env config, Docker, graceful shutdown, migrations | Hardcoded, single file |
| Time to build | ~30 min (requirements + implementation) | Unknown |
| Builder | Semi-technical engineer + AI agents | Human engineer |

The experiment demonstrates that a semi-technical engineer with the right agentic tooling can not only pass a backend engineering interview challenge, but produce a solution that is more complete, better tested, and more production-ready than the human-written reference answer -- in about 30 minutes.
