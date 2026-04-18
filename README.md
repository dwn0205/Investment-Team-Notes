# Investment Team Notes — Tech Stack Guide

This document walks through the full technology stack used in this project, what each piece does, and why it's here.

---

## 1. Monorepo with pnpm Workspaces

This project is a **monorepo** — multiple packages living in one repository, all managed together.

**Why?** The frontend, backend, database layer, and API spec all need to share types. Keeping them in one repo means you can make a change to the database schema and immediately see TypeScript errors in the frontend without publishing anything to npm.

```
/
├── artifacts/
│   ├── api-server/         ← Express backend
│   └── investment-notes/   ← React frontend
└── lib/
    ├── db/                 ← Database schema + client
    ├── api-spec/           ← OpenAPI spec
    └── api-client-react/   ← Generated API hooks
```

**pnpm** is the package manager (faster and more disk-efficient than npm/yarn). Each package has its own `package.json` and manages its own dependencies. The root `pnpm-workspace.yaml` tells pnpm which folders are packages.

- **Node.js version**: 24
- **pnpm version**: latest
- **TypeScript version**: 5.9

---

## 2. Frontend — React + Vite (`artifacts/investment-notes`)

The user-facing app is built with **React** (component-based UI) and **Vite** (the dev server and build tool).

**Vite** replaces older tools like Create React App. It starts almost instantly because it serves files as native ES modules in development — no bundling needed until production.

**Key libraries used:**
- `react-router-dom` — client-side routing between pages (`/notes`, `/weekly`, `/quarterly`)
- `@tanstack/react-query` — data fetching, caching, and background refetching
- `tailwindcss` — utility-first CSS (no separate CSS files; styles are class names in JSX)
- `shadcn/ui` + `radix-ui` — accessible UI primitives (dropdowns, dialogs, etc.)
- `lucide-react` — icon library
- `date-fns` — date formatting and manipulation

---

## 3. Backend — Express 5 (`artifacts/api-server`)

The API is a **Node.js** server using **Express 5** (the latest major version with async error handling built in).

It exposes a REST API that the frontend calls. Routes are organized by resource:
- `/api/notes` — CRUD for notes
- `/api/companies` — company list
- `/api/weekly` — weekly agenda data
- `/api/quarterly` — quarterly summaries + AI generation

**Validation**: Every request body is validated using **Zod** schemas before touching the database, so bad input is rejected early with clear error messages.

**Build**: The server is bundled with **esbuild** into a single CommonJS file for production. In development it runs via `tsx` (TypeScript execution without a build step).

---

## 4. Database — PostgreSQL + Drizzle ORM (`lib/db`)

The database is **PostgreSQL**, a robust relational database.

**Drizzle ORM** is the query layer — it lets you write database queries in TypeScript with full type safety. Unlike ORMs like Prisma, Drizzle produces standard SQL and gives you fine-grained control.

**Schema tables:**
| Table | Purpose |
|---|---|
| `companies` | Pipeline and portfolio companies |
| `users` | Team members (associate / principal / director) |
| `notes` | Core note records with category, date, versioning |
| `note_versions` | Audit trail — created whenever note content changes |
| `note_ai_results` | AI output per note (sentiment, risks, themes, metrics) |
| `quarterly_summaries` | Cached AI summaries per company / year / quarter |

**Pushing schema changes** (dev only — no migration files needed):
```
pnpm --filter @workspace/db run push
```

---

## 5. API Contract — OpenAPI + Orval (`lib/api-spec`)

The API is formally described in `lib/api-spec/openapi.yaml` — a machine-readable contract defining every endpoint, request shape, and response shape.

**Orval** reads that spec and auto-generates:
- TypeScript interfaces for every request/response type
- React Query hooks (`useListNotes`, `useGetQuarterly`, etc.) with correct types

This means the frontend never has to manually write `fetch()` calls or type out response shapes — they're generated from the spec.

To regenerate after changing the spec:
```
pnpm --filter @workspace/api-spec run codegen
```

---

## 6. AI — OpenAI via Replit AI Integration

AI features (sentiment analysis, weekly agenda generation, quarterly summaries) are powered by **OpenAI's API**, accessed through Replit's managed AI integration — no API key management needed.

Every time a note is saved, the backend asynchronously sends the note content to OpenAI and stores the result in `note_ai_results`. This includes:
- **Sentiment** — positive / neutral / negative
- **Sentiment score** — a number from -1 to 1
- **Key risks** — extracted risk statements
- **Themes** — thematic tags
- **Key metrics** — any numbers or data points mentioned

AI processing is always non-blocking: if it fails, the note is still saved and the user sees no error.

---

## 7. Key Commands

| Command | What it does |
|---|---|
| `pnpm run typecheck` | Type-check all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client from OpenAPI spec |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |
| `pnpm --filter @workspace/api-server run dev` | Run API server locally |
| `pnpm --filter @workspace/scripts run seed` | Seed database with test data |
