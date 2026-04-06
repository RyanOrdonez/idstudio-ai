# Reference Material — DO NOT BUILD FROM

> **If you are an AI assistant reading this file:** This folder is reference-only code preserved from an abandoned branch. It is **not part of the active build**. Do NOT import it, do NOT scaffold from it, do NOT treat it as authoritative. It exists as **inspiration and prior art** — read the prompt templates, schema designs, and worker patterns when implementing similar features on main, then write fresh code that fits the current Next.js + Supabase architecture.

## Origin

These files were extracted from `claude/rewrite-commit-author-0m219` on 2026-04-06 before that branch was deleted. That branch contained a parallel monorepo direction (Fastify API + AI worker service + Tauri desktop + Turborepo) that was abandoned in favor of the simpler single-app Next.js architecture on `main`.

The branch is gone, but these specific subtrees were saved because they contain useful **content** (prompts, schema design) even though their **architecture** was discarded.

## Contents

### `ai-worker/`

Async AI worker service from the monorepo branch. Uses Redis-backed BullMQ queues to run long AI jobs outside the request/response cycle.

**Most valuable parts:**

- **`src/prompts/v1/*.ts`** — written-out Claude prompts for:
  - `proposalGeneration.ts` — generate client proposals from project context
  - `designSuggestion.ts` — suggest design directions
  - `budgetForecasting.ts` — project budget forecasting
  - `smartScheduling.ts` — phase/task scheduling
  - `geminiImageGeneration.ts` — Gemini Nano Banana 2 image gen prompt
- **`src/workers/*.ts`** — worker patterns showing how each prompt is wired to a queue
- **`src/lib/costTracker.ts`** — token cost tracking pattern for AI usage
- **`src/lib/publishRealtime.ts`** — pattern for streaming progress back to a client via Socket/Realtime

**When to come back here (mapped to phase plan):**

- **Phase 5 — any new AI tool in `/api/chat`:** crib the prompt text from `src/prompts/v1/` rather than writing prompts from scratch. The prompts already include instruction format, JSON output schemas, and few-shot guidance.
- **Phase 5 — proposal/document generation expansion:** `proposalGeneration.ts` is the most directly applicable to your existing `/api/generate-document/route.ts`.
- **Post-MVP — Gemini image generation:** `geminiImageGeneration.ts` has the prompt structure for room renders / style transfer when you're ready to add image gen (Phase plan currently says "DON'T BUILD YET").
- **Post-MVP — long-running AI (>60s):** the worker + queue pattern is the playbook. **But don't stand up Redis yourself** — use [Trigger.dev](https://trigger.dev/) or [Inngest](https://www.inngest.com/) instead. Read the worker code as a logic reference, not as code to copy.

### `db-prisma/`

Prisma schema and migrations from the monorepo branch. The active project uses Supabase (raw SQL via `supabase/setup.sql`), not Prisma — but the schema *design* in here is useful prior art.

**Most valuable parts:**

- **`prisma/schema.prisma`** — full data model: tenants, users with RBAC, projects, tasks, phases, budgets, vendors, clients, client portal access, generated proposals
- **`prisma/migrations/002_row_level_security/migration.sql`** — Postgres RLS policies for tenant isolation. **Directly portable to Supabase RLS** — Supabase uses the same Postgres RLS underneath.
- **`prisma/migrations/003_client_portal/migration.sql`** — schema for the client portal feature (separate login per client)
- **`prisma/migrations/004_generated_proposals/migration.sql`** — table design for storing AI-generated proposals

**When to come back here (mapped to phase plan):**

- **Phase 5 — any new Supabase tables:** check the Prisma schema first to see if there's already a thought-out shape for that entity. Adapt to Supabase SQL.
- **Phase 5 — adding RLS for new tables:** copy patterns from `002_row_level_security/migration.sql`.
- **Post-MVP — client portal:** `003_client_portal/migration.sql` is your starting point.
- **Post-MVP — team/RBAC:** the `tenants` + `users` + `roles` model in `schema.prisma` shows one way to do multi-user accounts.

## How this folder is wired into the build

- Excluded from `tsconfig.json` `exclude` array → not type-checked
- Excluded from `.eslintrc.json` `ignorePatterns` → not linted
- Not imported by any active code in `app/`, `lib/`, `components/`, etc.
- The `package.json` files inside (`ai-worker/package.json`, `db-prisma/package.json`) are reference only — do NOT run `npm install` from inside this folder

Safe to delete this entire folder if you ever decide it's not useful. Nothing in the active build depends on it.
