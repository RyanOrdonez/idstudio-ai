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
│   │   ├── mood-boards/     # Mood board builder (coming soon)
│   │   ├── sourcing/        # Product sourcing & FF&E (coming soon)
│   │   ├── financials/      # Invoicing & expenses (coming soon)
│   │   └── analytics/       # Business metrics (coming soon)
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

## Current Status

### Completed
- [x] Next.js 14 with App Router
- [x] Design system (warm neutrals, Playfair + Satoshi, shadcn/ui, Framer Motion)
- [x] Dashboard layout with collapsible sidebar + persistent AI chat panel
- [x] Supabase auth (signup with success flow, login, session management)
- [x] Database schema with RLS (profiles, clients, projects, files, subscriptions)
- [x] Claude API integration (chat, assistant, document generation)
- [x] Google Gemini integration (design concept image generation)
- [x] Projects page — full CRUD
- [x] Clients page — full CRUD
- [x] Files page — full CRUD with Supabase Storage
- [x] Settings page — profile, subscription, billing
- [x] Reskinned login & signup pages with polished UX
- [x] AI credit system — weekly credits, model selector (Haiku/Sonnet/Opus), credit bar, upgrade paywall
- [x] AI tool system — Claude function calling for create/update/list clients, projects, files
- [x] Draggable chat panel resize (340px–700px)
- [x] Auto-expanding textarea input with reset on send
- [x] Duplicate client prevention (list_clients before create, update_client tool)
- [x] Server-side route protection via middleware (cookie-based Supabase client, redirect-after-login on `/dashboard`, `/projects`, `/clients`, `/files`)

### AI Chat — Future Revisions
- [ ] **Chat memory** — persist conversation history across sessions (Supabase storage per user)
- [ ] **Credit deduction by tier** — differentiate actual credit costs when Haiku/Opus model access is available on Anthropic account
- [ ] **Upgrade button** — prominent "Get more credits" CTA in chat when credits are low, linking to billing/plans page
- [ ] **Chat history panel** — expandable sidebar (right side) showing past conversations, searchable, click to reload
- [ ] **Project tools** — add/edit projects via chat (create_project, update_project, add phases/tasks)
- [ ] **Email drafting tool** — dedicated email composer in chat with send-ready formatting, subject lines, follow-up templates
- [ ] **Mood board tool** — generate mood board concepts via chat, save to mood boards section
- [ ] **Proposal generation** — create client proposals with scope, timeline, budget breakdown via chat
- [ ] **Budget tool** — generate and edit project budgets conversationally
- [ ] **Sourcing tool** — product search/recommendations with trade vendor suggestions
- [ ] **Email account integration** — connect user's email (Gmail/Outlook OAuth) so AI can read emails for project context, draft replies, and track client communication

### In Progress (Phase 3)
- [ ] Project phases, tasks, and kanban board
- [ ] Mood board builder (drag-and-drop)
- [ ] Client portal (share progress with clients)
- [ ] Product sourcing & FF&E schedules
- [ ] Financial tools — invoicing, expense tracking, budgets

### Planned (Phase 4)
- [ ] Marketing site & onboarding flow
- [ ] Mobile-responsive refinements
- [ ] Dark mode
- [ ] Pricing tier enforcement ($49 / $149 / $299)
- [ ] Email notifications (Resend)
- [ ] Team collaboration features

## Branches

- **`main`** (active) — single Next.js 14 app, the architecture documented above. All current development happens here.
- **`claude/rewrite-commit-author-0m219`** (archived reference) — an alternate monorepo direction (apps/api Fastify + apps/ai-worker + apps/desktop Tauri + packages/ui, Turborepo, pnpm workspaces). Contains ~17 commits of epic work (IDS-3 through IDS-18). Not merged into main and not on the current roadmap; kept as a reference for the monorepo direction in case it is revived.

## License

Private — All rights reserved.
