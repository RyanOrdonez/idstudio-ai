# IDStudio.ai

The all-in-one AI-powered platform for interior designers. Manage projects, clients, files, finances, and mood boards from a single beautiful dashboard — with a built-in AI assistant that drafts emails, generates documents, creates design concepts, and more.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **State**: Zustand
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI — Text**: Anthropic Claude API
- **AI — Images**: Google Gemini
- **Payments**: Stripe (subscriptions & billing)
- **Icons**: Lucide React
- **Fonts**: Playfair Display (headings) + Satoshi (UI)

## Quick Start

### Prerequisites

- Node.js 18.17+
- A [Supabase](https://supabase.com) project
- API keys: Anthropic (Claude), Google AI (Gemini), Stripe

### Setup

```bash
npm install
```

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=idstudio-files
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Database

Run `supabase/setup.sql` in your Supabase SQL Editor. This creates all tables (profiles, clients, projects, files, subscriptions), RLS policies, storage bucket, and the auto-profile trigger.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
IDStudio.Ai/
├── app/
│   ├── dashboard/           # Authenticated dashboard pages
│   │   ├── page.tsx         # Overview
│   │   ├── projects/        # Project management (CRUD)
│   │   ├── clients/         # Client management (CRUD)
│   │   ├── files/           # File management (CRUD + storage)
│   │   ├── settings/        # Account & subscription settings
│   │   ├── sourcing/        # Product sourcing & clipped product library (built)
│   │   ├── mood-boards/     # Mood board builder (placeholder — see BUILD-PLAN.md)
│   │   ├── financials/      # Invoicing & expenses (placeholder — see BUILD-PLAN.md)
│   │   └── analytics/       # Business metrics (placeholder — see BUILD-PLAN.md)
│   ├── login/               # Sign in
│   ├── signup/              # Create account
│   ├── api/                 # API routes (chat, assistant, stripe)
│   └── (marketing)/         # Public pages (about, pricing, etc.)
├── components/
│   ├── layout/              # DashboardLayout, Sidebar, AIChatPanel
│   ├── ui/                  # shadcn/ui primitives
│   ├── AuthWrapper.tsx      # Route protection
│   ├── ClientSideLayout.tsx # Auth + layout provider
│   └── ChatInterface.tsx    # AI chat component
├── contexts/
│   └── AuthProvider.tsx     # Supabase auth context
├── stores/
│   └── useAppStore.ts       # Zustand global state
├── hooks/                   # useAuth, useSubscription
├── lib/                     # supabaseClient, stripe, utils
├── supabase/
│   └── setup.sql            # Full database schema
├── PRODUCT-PLAN.md          # Master product specification
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Design System

- **Palette**: Warm neutrals (stone/sand tones) with a rich primary accent
- **Typography**: Playfair Display for headings, Satoshi/system sans for UI
- **Components**: shadcn/ui with custom warm variants
- **Motion**: Framer Motion fade/slide transitions on page load
- **Layout**: Collapsible sidebar + persistent AI chat panel on the right

## Build Plan

**Single source of truth: [BUILD-PLAN.md](./BUILD-PLAN.md).**

That file lists what's done, what's broken, and the strict linear order for everything that comes next. No phases, no modules, no weeks — top of "Next Up" is the next task.

For long-form product vision and context, see [PRODUCT-PLAN-archive.md](./PRODUCT-PLAN-archive.md) (archived — do not use for build ordering).

For long-term strategic feature ideas, see [FUTURE-GROWTH-FEATURES-archive.md](./FUTURE-GROWTH-FEATURES-archive.md) (post-launch only).

## Branches

- **`main`** (active) — single Next.js 14 app, the architecture documented above. All current development happens here.

## Reference Material

`reference/` contains preserved code from an abandoned monorepo branch (April 2026). It is **not part of the build** — excluded from TypeScript and ESLint, never imported. It's saved as prior art so future features don't have to start from a blank page.

**Phase plan checkpoints — review the relevant subfolder before starting these tasks:**

| When you're working on | Check this reference | Why |
|---|---|---|
| **Phase 5** — any new AI tool in `/api/chat` or expanding document/proposal generation | `reference/ai-worker/src/prompts/v1/` | Pre-written Claude prompts for proposals, design suggestions, budget forecasting, scheduling, image gen — copy the prompt text, not the architecture |
| **Phase 5** — any new Supabase table or RLS policy | `reference/db-prisma/prisma/` | Schema design for tenants, projects, tasks, budgets, vendors, client portal + reusable RLS patterns |
| **Phase 6** — deployment | nothing in reference applies; main is correctly scoped for Vercel + Supabase | — |
| **Post-MVP** — Gemini image generation (Phase plan currently says "DON'T BUILD YET") | `reference/ai-worker/src/prompts/v1/geminiImageGeneration.ts` + `src/workers/geminiImageGeneration.ts` | Prompt structure and worker pattern for room renders / style transfer |
| **Post-MVP** — client portal (separate client login) | `reference/db-prisma/prisma/migrations/003_client_portal/` | Schema design for client portal access |
| **Post-MVP** — long-running AI jobs (>60s, batch processing) | `reference/ai-worker/` whole tree | Worker + queue patterns. **Use Trigger.dev or Inngest, not raw Redis** — read the worker code as logic reference only |

See `reference/README.md` for the full inventory and ground rules.

## License

Private — All rights reserved.
