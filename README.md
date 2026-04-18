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

## 7. User Behavior & Permissions

The app has three user roles, each with different levels of access. The active user is selected from a switcher in the sidebar — this simulates different team members using the tool.

### Roles

| Role | Description |
|---|---|
| **Associate** | Junior team member. Logs notes and views all data. |
| **Principal** | Mid-level. Same note access as associate. |
| **Director** | Senior. Has exclusive control over the weekly agenda. |

### Permission Rules

**Editing notes**
Any user can edit any note, regardless of who originally wrote it. This reflects how a PE team collaborates — a director might refine an associate's note after a follow-up call. When a content edit is made, the system records who made the edit and creates a version snapshot.

**Deleting notes**
A user can only soft-delete their own notes. The delete button is hidden on notes written by someone else. Deletion is always soft — the record remains in the database with `is_deleted = true` and is simply excluded from all views.

**Weekly agenda**
Only directors can add or remove a note from the weekly agenda (the `include_in_weekly` flag). The checkbox to toggle this is hidden for associates and principals. This ensures the agenda is curated by senior staff, not cluttered by every note logged during the week.

### Current Implementation Status

| Rule | UI enforced | API enforced |
|---|---|---|
| Any user can edit any note | Yes | Yes |
| Users can only delete their own notes | Yes | No — API has no ownership check |
| Only directors can toggle weekly agenda | Yes | No — API has no role check |

The two gaps mean the rules rely on the frontend being the only entry point. If the API were ever called directly (e.g. by an integration or script), those restrictions would not apply.

---

## 8. How the App is Expected to be Used

This section describes the intended day-to-day workflow for a private equity team using the app.

---

### Selecting Who You Are

When the app loads, a user switcher is shown in the bottom-left corner of the sidebar. Team members select their own name before interacting with the app. This determines what actions are available to them (e.g. the weekly agenda toggle only appears for directors).

---

### Logging a Note

Any team member can log a note at any time via the **+ New Note** button.

1. Select the **category** — Generic (market observation), Pipeline (a company being evaluated), or Portfolio (an invested company).
2. If Pipeline or Portfolio, select the **company**.
3. Set the **note date** — the date the observation or meeting occurred, which may differ from today.
4. Write the **note content** — call summaries, meeting takeaways, market observations, red flags, etc.
5. Submit. The note is saved immediately. AI analysis (sentiment, risks, themes) runs in the background and appears shortly after.

---

### Reviewing and Editing Notes

The **All Notes** page shows the full note history with filters for category, company, date range, and author.

- Click any note to expand it inline and see the full content, AI analysis, and version history.
- Any team member can **edit** any note — useful when a director wants to refine a junior analyst's write-up after a follow-up conversation.
- Editing the content creates a version snapshot so the original text is never lost.
- A team member can **delete** only their own notes.

---

### Building the Weekly Agenda

Throughout the week, associates and principals log notes as they happen. At the end of the week (or before the Monday meeting), a **director** reviews the notes and flags the most relevant ones for the agenda.

- Open any note and enter edit mode.
- The **Include in Weekly Agenda** checkbox appears (directors only).
- Check it to add the note to the agenda. Uncheck to remove it.

The **Weekly Agenda** page then shows only flagged notes, grouped and enriched with:
- A sentiment breakdown across all agenda notes
- A Key Risks panel pulled from AI analysis
- A "Needs Attention" filter to surface only negative notes

---

### Running the Weekly Meeting

On the day of the meeting, the team opens the **Weekly Agenda** page. It gives a structured view of:
- How many notes were flagged, and the overall sentiment split
- The most significant risks extracted across all notes
- Each individual note, expandable inline

The director can use the "Needs Attention" toggle to focus the conversation on concerning items first.

---

### Generating a Quarterly Summary

At the end of each quarter, the team uses the **Quarterly Summaries** page to synthesise everything written about a portfolio company over that period.

1. Select the **portfolio company**, **year**, and **quarter**.
2. Click **Generate Summary**. The AI reads all relevant notes (both company-specific and general market notes from that quarter) and produces:
   - A performance direction (improving / stable / deteriorating) based on sentiment ratios
   - An executive summary in bullet points
   - Key risks and recurring themes
3. The summary is saved and can be **regenerated** at any time if new notes have been added.

The underlying notes used to generate the summary are shown below it, split into Company Notes and Market / Generic Notes, both collapsible.

---

### Typical Weekly Rhythm

| When | Who | Action |
|---|---|---|
| Throughout the week | Associates / Principals | Log notes after calls, meetings, and research |
| End of week | Director | Review notes, flag relevant ones for the weekly agenda |
| Monday meeting | Full team | Review Weekly Agenda page together |
| End of quarter | Director | Generate quarterly summary per portfolio company |

---

## 9. Data Model

The database has six tables. Here is each one, what it stores, and why it was designed that way.

---

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `email` | text | Unique — one account per person |
| `full_name` | text | Display name |
| `role` | enum | `associate`, `principal`, or `director` |
| `created_at` | timestamp | Record creation time |

**Why:** The app is multi-user. Every note is attributed to a team member, and their role is shown alongside notes so readers know the seniority/perspective of who wrote it.

---

### `companies`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `name` | text | Unique company name |
| `type` | enum | `pipeline` (being evaluated) or `portfolio` (already invested) |
| `status` | enum | `active`, `exited`, or `dropped` |
| `created_at` | timestamp | Record creation time |

**Why:** The two types (`pipeline` vs `portfolio`) drive different behaviour across the app. Quarterly summaries are only for portfolio companies (you've already invested). Pipeline companies are tracked during evaluation. The `status` field lets the team mark companies as exited or dropped without deleting them — preserving the historical note record.

---

### `notes`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `company_id` | UUID | Optional — null for generic/market notes |
| `user_id` | UUID | Who wrote the note |
| `content` | text | The note body |
| `category` | enum | `generic`, `pipeline`, or `portfolio` |
| `stage_at_time_of_note` | enum | `initial`, `final`, or `closed` — pipeline stage when note was written |
| `note_date` | timestamp | When the activity/observation occurred (not when it was entered) |
| `include_in_weekly` | boolean | Whether this note surfaces in the weekly agenda |
| `is_deleted` | boolean | Soft delete — records are never physically removed |
| `version_count` | integer | How many times the content has been edited |
| `created_at` / `updated_at` | timestamp | Record timestamps |

**Why this design:**
- `note_date` is separate from `created_at` because analysts often log notes after the fact — you might write up a call on Friday that happened on Tuesday. `note_date` is the business date; `created_at` is the system date.
- `company_id` is nullable so that market observations and macro notes (not tied to any company) can still be logged in the same system.
- `is_deleted` (soft delete) means deleted notes are hidden but never lost. This is important for audit trails — a PE firm needs to be able to reconstruct its decision history.
- `include_in_weekly` is a deliberate flag — analysts choose which notes are relevant enough to surface in the weekly team agenda. Not every note is worth discussing.
- A database-level `CHECK` constraint enforces that portfolio notes must always have `stage_at_time_of_note = 'closed'`, since a portfolio company is past the pipeline stage.

---

### `note_versions`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `note_id` | UUID | Links to the parent note |
| `content_snapshot` | text | Full copy of the note content at that point in time |
| `user_id` | UUID | Who made the edit |
| `edit_reason` | text | Optional explanation for the change |
| `created_at` | timestamp | When the edit happened |

**Why:** Any time a note's content changes, a version record is created. This gives a complete audit trail — who changed what, when, and why. This matters in a regulated investment context where decisions need to be traceable.

---

### `note_ai_results`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `note_id` | UUID | One-to-one link to a note (unique constraint) |
| `sentiment` | enum | `positive`, `neutral`, or `negative` |
| `sentiment_score` | real | Numeric score from -1.0 (very negative) to 1.0 (very positive) |
| `key_extraction` | text | JSON blob — risks, themes, and key metrics extracted from the note |
| `source` | enum | `ai` (generated) or `manual` (human override) |
| `generated_at` | timestamp | When the AI processed it |

**Why:** AI analysis is stored separately from notes rather than as columns on the `notes` table for two reasons. First, AI processing is async — the note exists before the AI result does. Second, it keeps the notes table clean and focused on the content the human wrote. The one-to-one unique constraint (`note_id`) ensures each note has at most one active AI result; re-processing a note replaces the previous result.

The `sentiment_score` gives more granularity than the three-label sentiment alone — a score of -0.9 and -0.1 are both "negative" but very different in severity.

---

### `quarterly_summaries`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Which portfolio company |
| `year` | integer | e.g. 2026 |
| `quarter` | integer | 1–4 |
| `summary_text` | text | AI-generated executive summary (bullet points) |
| `overall_sentiment` | enum | `positive`, `neutral`, or `negative` |
| `key_themes` | text | JSON array of themes |
| `risks` | text | JSON array of risks |
| `generated_at` | timestamp | When the summary was generated |

**Why:** Generating a quarterly summary from scratch via AI every time someone opens the page would be slow and expensive. Instead, results are cached here. The team can explicitly regenerate when they want a fresh analysis. The summary is scoped to `company_id + year + quarter` — one record per company per quarter.

---

### Relationships at a Glance

```
users ──────────────< notes >─────────── companies
                        │
               ┌────────┴────────┐
               │                 │
         note_versions    note_ai_results

companies ──< quarterly_summaries
```

- One **user** writes many **notes**
- One **company** has many **notes** and many **quarterly_summaries**
- One **note** has many **note_versions** (edit history)
- One **note** has at most one **note_ai_results** record

---

## 10. Key Commands

| Command | What it does |
|---|---|
| `pnpm run typecheck` | Type-check all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client from OpenAPI spec |
| `pnpm --filter @workspace/db run push` | Push DB schema changes (dev only) |
| `pnpm --filter @workspace/api-server run dev` | Run API server locally |
| `pnpm --filter @workspace/scripts run seed` | Seed database with test data |
