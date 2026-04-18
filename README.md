# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed` — seed the database with initial data

## Investment Team Notes App

### Features
- **All Notes page** (`/notes`): Dense table view with filters (category, company, date range, includeInWeekly, author). Click to expand inline with edit, version history, and AI analysis.
- **Create Note** (`/notes/new`): Form with category-aware validation (companyId required for pipeline/portfolio).
- **Weekly Agenda** (`/weekly`): Notes from last 7 days with `includeInWeekly=true`, grouped by company/category.
- **Quarterly Summaries** (`/quarterly`): Company + quarter selector, AI-generated summary with bullet points, sentiment, risks, themes.

### Database Schema
- `companies` — pipeline/portfolio companies
- `users` — team members with roles (associate/principal/director)
- `notes` — core table with category/stage/versioning/soft delete
- `note_versions` — audit trail (created on content change)
- `note_ai_results` — AI analysis per note (sentiment, risks, themes, metrics)
- `quarterly_summaries` — cached AI summaries by company/year/quarter

### Business Rules
- Notes are soft-deleted (isDeleted=true)
- Generic notes must have null companyId and null stage
- Pipeline/portfolio notes require companyId
- AI processing is async and non-blocking (failures never break user flows)
- Note updates create version records if content changes

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
