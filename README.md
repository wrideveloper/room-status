# Room Status

![Room Status](https://github.com/user-attachments/assets/2e7a6d6c-4e66-4f34-9de4-220f454fcb9a)

A small interview room operations tool for the WRI Open Recruitment event.

Interviewers register, pick a room, run a timed Google Form interview session,
and optionally send out a "break" status. A separate monitoring board shows, in
real time, what every room and interviewer is doing.

---

## Table of contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Getting started](#getting-started)
- [Scripts reference](#scripts-reference)
- [Domain model](#domain-model)
- [Database and migrations](#database-and-migrations)
- [Data sources](#data-sources)
- [Realtime transport](#realtime-transport)
- [Interview session lifecycle](#interview-session-lifecycle)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Known gaps and handover notes](#known-gaps-and-handover-notes)
- [Code style](#code-style)

---

## What it does

- **Landing page** (`/`): links to Interviewer and Monitoring, plus an admin
  broadcast dialog that pushes a message to every interviewer.
- **Register** (`/register`): an interviewer picks their name and room.
- **Interviewer console** (`/room/:id`): a 15 minute interview timer, an embedded
  Google Form prefilled with the interviewer and participant names, a break mode,
  a "PULANG" (go home) action, and in-app broadcast alerts.
- **Monitoring board** (`/room`): live status of every interviewer, grouped by
  room, with colour-coded dots (available / interviewing / on break) and elapsed
  interview time.

## Architecture

placeholder image stuff

The app is a React Router v8 framework-mode app deployed as a single Cloudflare
Worker. Persistence is Cloudflare D1 (SQLite) through Drizzle ORM. Realtime fan
out is a Durable Object using the WebSocket Hibernation API.

There is also a **secondary, no-Cloudflare target** (`APP_TARGET=sqlite`) that
runs on Node with `better-sqlite3` and an in-memory SSE hub. This exists so the
app can be developed and demoed without a Cloudflare account. The two runtimes
are selected at build time through Vite aliases (`#db`, `#platform`) and a
`VITE_REALTIME` flag.

## Tech stack

| Area        | Choice                                             |
|-------------|----------------------------------------------------|
| Framework   | React Router v8 (framework mode, SSR)              |
| UI          | React 19, TypeScript, Tailwind CSS v4, Radix UI    |
| Icons       | lucide-react                                       |
| Database    | Cloudflare D1 (SQLite), Drizzle ORM                |
| Realtime    | Durable Object + WebSocket Hibernation (prod), SSE (fallback) |
| Tooling     | Vite, Biome, Wrangler, Node 24, pnpm               |

## Project structure

```
room-status/
  app/
    components/
      features/dino/          Break-mode animation (CSS + audio)
      nav-links.tsx           Shared top-left navigation
      ui/                     Radix-based UI primitives
    durable-object/
      RoomBroker.ts           WebSocket broadcast hub (hibernation API)
    lib/
      data/interviewer.ts     Static interviewer roster (id + name)
      db/
        schema.ts             Drizzle schema
        client.ts             Runtime-selected client (alias #db)
        client.workers.ts     D1 client
        client.sqlite.ts      better-sqlite3 client
        drizzle/              Generated SQL migrations + snapshots
      platform.ts             Runtime-selected bindings (alias #platform)
      platform.workers.ts     Cloudflare env
      platform.sqlite.ts      Empty env for the Node target
      realtime.ts             Client subscription helper (ws or sse)
      server/                 Server-only helpers (notify, sse, util)
      utils.ts                cn(), form URL builder, session storage helpers
    routes/                   File-based routes (see app/routes.ts)
    root.tsx, entry.client.tsx, entry.server.tsx
  workers/
    app.ts                    Worker entry: WS upgrade + React Router
  public/
  wrangler.jsonc              Worker, D1 and Durable Object config
  vite.config.ts              Targets, aliases, env prefixes
  drizzle.config.ts           Drizzle Kit config (schema + output dir)
  react-router.config.ts
```

### Routes

| Path                                        | File                              | Purpose                          |
|---------------------------------------------|-----------------------------------|----------------------------------|
| `/`                                         | `routes/_index.tsx`               | Landing + broadcast              |
| `/register`                                 | `routes/register._index.tsx`      | Interviewer registration         |
| `/room`                                     | `routes/room._index.tsx`          | Monitoring board                 |
| `/room/:id`                                 | `routes/room.$id.tsx`             | Interviewer console              |
| `/api/room`                                 | `routes/api.room.ts`              | GET grouped status, DELETE all   |
| `/api/room/:id/sse`                         | `routes/api.room.$id.sse.ts`      | SSE stream (Node target)         |
| `/api/room/:id/broadcast`                   | `routes/api.room.$id.broadcast.ts`| Send a broadcast                 |
| `/api/room/:id/ws`                          | `workers/app.ts`                  | WebSocket upgrade (prod)         |
| `/.well-known/appspecific/com.chrome.devtools.json` | `routes/wellknown.ts`     | Silences a DevTools probe        |

## Prerequisites

- Node.js 24 or newer (see `package.json` engines)
- pnpm 12
- Optional: a Cloudflare account and Wrangler login (needed only for deploy and
  remote D1). Not required to run locally with the SQLite target.

## Environment variables

Create a `.env` file in the repo root:

```
GOOGLE_FORM_EMBED_URL=<google form viewform url with prefill placeholders>
```

- `GOOGLE_FORM_EMBED_URL` is read at **build time**. It must contain the two
  placeholders `{interviewer}` and `{interviewee}`. The app substitutes the
  names into those placeholders and sets the result as the iframe `src`.

See the `.env.example` file for the shape. See
[Google Form prefill](#google-form-prefill) for how the entry IDs work.

## Getting started

Install dependencies:

```bash
pnpm install
```

Run the primary target (Cloudflare Workers + D1 emulation via Wrangler):

```bash
pnpm dev
```

Run the fallback target (Node + better-sqlite3 + SSE):

```bash
pnpm dev:sqlite
```

For the SQLite target, create `store.db` from the migrations first:

```bash
pnpm exec drizzle-kit migrate
```

## Scripts reference

| Script                  | What it does                                              |
|-------------------------|-----------------------------------------------------------|
| `dev`                   | Dev server, Cloudflare Workers target                     |
| `dev:sqlite`            | Dev server, Node + SQLite target                          |
| `build`                 | Production build (Workers)                                |
| `build:sqlite`          | Production build (Node/SQLite)                            |
| `start`                 | Serve a SQLite build with `react-router-serve`            |
| `deploy`                | Build then `wrangler deploy`                              |
| `db:migrate:local`      | Apply D1 migrations to the local emulated database        |
| `db:migrate:remote`     | Apply D1 migrations to the remote (production) database   |
| `cf-typegen`            | Regenerate `worker-configuration.d.ts` with `wrangler types` |
| `typecheck`             | `wrangler types` + route typegen + `tsc`                  |
| `lint` / `lint:fix`     | Biome lint                                                |
| `format`                | Biome format                                              |

## Domain model

### Interviewer status

Each `interviewers` row carries an explicit, server-authoritative `status`:

- `idle` - available, no active interview.
- `interviewing` - an interview is running. `interviewee` holds the participant
  name and `interview_started_at` (epoch ms) anchors the countdown.
- `break` - on break. `interviewee` and `interview_started_at` are null.

The interviewer console derives its dialog and countdown from this status rather
than from component state, so a page refresh restores the running session.

### Session resume

When an interviewer opens `/room/:id`, their id is stored in `localStorage`
(key `room-status:interviewer-id`). The landing page and the register page
redirect back to `/room/:id` if that key exists. The key is cleared when the
interviewer goes home (PULANG) or when the row no longer exists (404).

### Rooms

Rooms are defined in the register page (`register._index.tsx`). The stored value
is a lowercase slug such as `lpy-4`; the UI upper-cases it for display.

## Database and migrations

Schema lives in `app/lib/db/schema.ts`. Migrations are generated by Drizzle Kit
into `app/lib/db/drizzle/`.

Generate a migration after editing the schema:

```bash
pnpm exec drizzle-kit generate
```

Apply migrations:

```bash
# Local D1 (Wrangler emulation)
pnpm db:migrate:local

# Remote D1 (production)
pnpm db:migrate:remote

# The Node/SQLite target (store.db)
pnpm exec drizzle-kit migrate
```

Tables:

- `interviewers`: `id`, `name`, `room`, `status`, `interviewee`,
  `interview_started_at`, `updated_at`.
- `interviewees`: `id` (autoincrement), `name`. Participant roster used by the
  console.

## Data sources

- **Interviewer roster**: `app/lib/data/interviewer.ts` (`INTERVIEWERS`). This is
  a static list of `{ id, name }` generated from the recruitment form responses.
  The `id` is used as the database primary key and in the `/room/:id` URL.
- **Participant roster**: the `interviewees` table. Seed it from a SQL file:

  ```bash
  # Local D1
  pnpm exec wrangler d1 execute room-status-db --local --file=/path/to/interviewees.sql

  # Remote D1
  pnpm exec wrangler d1 execute room-status-db --remote --file=/path/to/interviewees.sql
  ```

  The `interviewees` table is created by migration `0002_add-interviewees.sql`,
  so apply migrations before loading the data.

- **Rooms**: defined inline in `register._index.tsx`.

## Realtime transport

Both runtimes expose the same client API (`subscribeToRoom` in
`app/lib/realtime.ts`) and the same message shapes:

```ts
type RoomMessage =
  | { type: "status"; interviewersByRoom: Record<string, Interviewer[]> }
  | { type: "broadcast"; message: string };
```

- **Workers (production)**: `RoomBroker` Durable Object using the WebSocket
  Hibernation API. The Worker entry (`workers/app.ts`) intercepts
  `/api/room/:id/ws` upgrades before React Router and forwards them to the
  object. Server code fans out by POSTing to the object's `/broadcast` endpoint
  (`app/lib/server/notify.server.ts`).
- **Node/SQLite (fallback)**: an in-memory hub that streams over SSE
  (`app/lib/server/sse.server.ts`, `app/routes/api.room.$id.sse.ts`).

The client picks the transport from `import.meta.env.VITE_REALTIME`, which Vite
sets to `ws` or `sse` based on `APP_TARGET`.

Note: all clients currently subscribe to a single channel. The client uses room
id `"0"` and `notify.server.ts` defaults to `DEFAULT_ROOM_ID = "0"`, so broadcasts
are global rather than per room.

## Interview session lifecycle

1. Interviewer registers (or resumes) and lands on `/room/:id`.
2. They type the participant name and press "MULAI INTERVIEW". The server sets
   `status = 'interviewing'` and `interview_started_at = Date.now()`, and the
   Google Form dialog opens with a prefilled form.
3. The countdown is computed from `interview_started_at`, so it survives a
   refresh. When it crosses zero an alert appears.
4. "ISTIRAHAT DULS" sets `status = 'break'` and shows the break dialog.
5. "Done" (or the break auto-reset) sets `status = 'idle'`.
6. "PULANG" deletes the interviewer row, clears the stored session id, and
   redirects home.

### Google Form prefill

Google Forms identifies each question by an internal **entry id**. Prefilling is
done by appending `entry.<id>=<value>` query parameters to the form's `viewform`
URL. In an iframe the parameters must be on the iframe's own `src` (which is what
this app does).

To get the entry ids for a form: open the form editor, use the three-dot menu and
"Get pre-filled link", fill sample answers, and copy the generated URL. The URL
contains the `entry.*` ids. Alternatively read them from the form page source
(`<input name="entry.123456789">`).

Set `GOOGLE_FORM_EMBED_URL` so the two placeholders map to the correct entry ids,
for example:

```
GOOGLE_FORM_EMBED_URL="https://docs.google.com/forms/d/e/<form-id>/viewform?usp=pp_url&embedded=true&entry.1111111111={interviewer}&entry.2222222222={interviewee}"
```

Notes:

- `embedded=true` renders the compact embed instead of the full Google page.
- The form must be published.
- Values must match option text exactly for radio/checkbox/dropdown questions.
- Entry ids can change if a question is deleted and recreated.

## Deployment

Production is a single Cloudflare Worker named `room-status`.

```bash
pnpm deploy          # react-router build && wrangler deploy
```

`wrangler.jsonc` defines:

- `main`: `./workers/app.ts`
- `compatibility_date`: `2026-10-07` and `nodejs_compat`
- D1 binding `DB` -> database `room-status-db`
- Durable Object binding `ROOM_BROKER` -> class `RoomBroker` (SQLite storage)

Before the first deploy on a new account or database:

1. `wrangler d1 create room-status-db` (then paste the id into `wrangler.jsonc`)
2. `pnpm db:migrate:remote`
3. Load seed data if needed (see [Data sources](#data-sources))

The D1 binding name must stay `DB`; the Workers code reads `env.DB`.

## Troubleshooting

### "Invalid WebSocket close code: 1006."

This appeared in production logs whenever a client disconnected abnormally
(phone switching networks, tab killed, and so on). The peer close code is then
`1006` (abnormal) or `1005` (no status received), which are reserved codes that
must never be sent back in a close frame. Echoing them through `ws.close()`
throws `InvalidAccessError`.

Fix: `RoomBroker.webSocketClose` ignores the reserved codes (`1005`, `1006`,
`1015`) and only calls `ws.close()` for normal codes. With
`web_socket_auto_reply_to_close` (default on compatibility dates on or after
`2026-04-07`) the runtime already completes the handshake, so nothing is lost.

### Chrome DevTools `.well-known` 404

Chrome's DevTools probes
`/.well-known/appspecific/com.chrome.devtools.json`. `app/routes.ts`
registers a route (`routes/wellknown.ts`) that answers it so it does not show up
as a 404 in logs.

### Hibernation trace noise

Logs such as the "NOSENTRY reporting trace" messages are internal `workerd`
logging from the WebSocket hibernation path. They are benign and not
actionable.

### `store.db`

`store.db` is only used by the `APP_TARGET=sqlite` target. The production and
default local flow use D1.

## Known gaps and handover notes

These are intentional for the event but worth knowing before extending the app:

- **No authentication.** Any client can hit any `/room/:id` or the API. This is
  acceptable for a trusted, on-site event but must change for anything public.
- **Global broadcast.** All clients share room id `"0"`; broadcasts are not
  scoped per room.
- **Static interviewer roster.** The list is committed in code; changing it
  requires a rebuild. The participant roster is seeded manually from SQL.
- **Google Form prefill depends on entry ids** that can drift if the form changes.
- **Operational steps that are documented but not automated:** applying the
  remote D1 migrations, loading `interviewees.sql` into remote D1, and setting
  the correct `GOOGLE_FORM_EMBED_URL` entry ids for a given form.

## Code style

- Biome handles lint and format (`pnpm lint`, `pnpm format`).
- Tabs for indentation, double quotes.
- Server-only modules use the `.server.ts` suffix.
- Path aliases: `#db` and `#platform` select the runtime implementation;
  `~/` maps to `app/`.
