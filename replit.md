# Investment Team Notes App

## Overview
Internal tool for a private equity team to log deal notes, track pipeline/portfolio activity, and generate AI-powered weekly agendas and quarterly summaries.

## Stack
- **Monorepo**: pnpm workspace — each package manages its own dependencies
- **Language**: TypeScript throughout
- **Frontend**: React + Vite (`artifacts/investment-notes`)
- **Backend**: Express API (`artifacts/api-server`)
- **Database**: PostgreSQL with Drizzle ORM (`lib/db`)
- **AI**: OpenAI via Replit AI integration

## Packages
- `artifacts/investment-notes` — React + Vite frontend
- `artifacts/api-server` — Express REST API
- `artifacts/mockup-sandbox` — Component preview server (canvas/design use)
- `lib/db` — Drizzle schema + database client (no build step, imported directly)
- `lib/api-spec` — OpenAPI spec (`openapi.yaml`)
- `lib/api-client-react` — Generated API client and React Query hooks

## Key Conventions
- DB migrations: `pnpm run push` from `lib/db` (uses Drizzle Kit)
- API client types at `lib/api-client-react/src/generated/api.schemas.ts` — manually updated when new fields are added
- `performanceDirection` on the quarterly page is computed client-side from sentiment ratios (not stored in DB)
- Generic/market notes: `category === "generic" && !companyId`
- Portfolio companies: `company.type === "portfolio"`

## Features
- **All Notes** — full note list with filters
- **Weekly Agenda** — AI-generated agenda with sentiment stats, key risks panel, needs-attention toggle
- **Quarterly Summaries** — per-company quarterly intelligence with performance direction, executive summary, risks/themes, and grouped underlying notes (Company Notes + Market/Generic Notes, both independently collapsible)

## Database Schema Highlights
- `notes` — core note records with `category`, `companyId`, `userId`, `noteDate`
- `note_ai_results` — AI output per note: `sentiment`, `sentimentScore` (real, -1 to 1), `risks`, `themes`, `keyMetrics`
- `companies` — `type: pgEnum("pipeline" | "portfolio")`
- `quarterly_summaries` — stored AI summaries per company/year/quarter
