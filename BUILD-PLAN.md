# IDStudio.Ai — Build Plan

> **This is the single source of truth for what to build and in what order.**
> No phases. No modules. No weeks. Just a linear queue: top of "Next Up" = next task.
> When a task is finished, mark it ✅ in **Current Status** and delete it from "Next Up".
>
> If you're an AI assistant: read this file first, then start at the top of **Next Up**. Do not invent priorities. Do not consult `PRODUCT-PLAN-archive.md` for ordering — it's archived for vision/context only.

Last updated: 2026-04-07

---

## Current Status

### What works in production right now

**Foundation**
- ✅ Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, Framer Motion
- ✅ Warm-neutral design system with Playfair Display + Satoshi typography
- ✅ Deployed to Vercel at https://idstudio-ai.vercel.app
- ✅ All env vars configured in Vercel (Supabase, Stripe, Anthropic, OpenAI, Canva, Google OAuth)

**Auth & Security**
- ✅ Supabase auth via cookie-based `createClientComponentClient`
- ✅ `middleware.ts` gates `/dashboard`, `/projects`, `/clients`, `/files` — redirects unauthed users to `/login?redirect=<path>`
- ✅ Authed users bounced away from `/login` and `/signup` to `/dashboard`
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, CSP, Permissions-Policy)
- ✅ Auto-trial subscription created on first dashboard visit

**Database (Supabase)**
- ✅ Tables: `profiles`, `clients`, `projects`, `project_phases`, `project_tasks`, `files`, `subscriptions`, `ai_usage`, `ai_messages`, `clipped_products`, `product_images`, `product_collections`, `collection_products`
- ✅ RLS enabled on all tables with per-user policies
- ✅ Auto-profile trigger on `auth.users` INSERT
- ✅ Storage bucket for project files

**Dashboard**
- ✅ Collapsible sidebar (68px ↔ 240px)
- ✅ Persistent AI chat panel on right with draggable resize (340px–700px) and auto-expanding textarea
- ✅ Overview page with stats and recent activity
- ✅ Login page (reskinned, branded left panel, redirect param support)
- ✅ Signup page (reskinned, validation, success → `/login?registered=true`)
- ✅ Settings page (profile, account, notifications, billing tabs)

**CRUD modules**
- ✅ Projects: full list/create/edit/archive + project detail page with **kanban board** (DnD-kit, drag-drop tasks across phases, 848 lines)
- ✅ Clients: full list/create/edit/archive
- ✅ Files: full list/upload/delete with Supabase Storage
- ✅ Sourcing/Product Library: full UI (663 lines)

**AI**
- ✅ Claude API at `/api/chat` with `Anthropic.Tool[]` typed tool calling, max 10-round tool loop
- ✅ 12 AI tools: `create_client`, `update_client`, `list_clients`, `create_project`, `list_projects`, `search_files`, `get_project_details`, `read_skill`, `list_clipped_products`, `clip_product`, `search_products`, plus duplicate-prevention guidance baked into tool descriptions
- ✅ Document generation API at `/api/generate-document` (proposals, contracts, invoices via Claude)
- ✅ Image concept generation at `/api/generate-image` (Gemini 1.5 Flash text descriptions — not actual image gen yet)
- ✅ AI credit system: weekly resets (ISO Monday), model selector (haiku/sonnet/opus), tier limits, credit bar UI, paywall when out of credits
- ✅ Per-message usage logging in `ai_messages` (analytics only — not full conversation history)

**Stripe**
- ✅ Stripe client (`lib/stripe.ts`) with FREE / Starter ($29/mo) / Pro ($79/mo) plan config, test mode
- ✅ `/api/checkout` — supports trial-to-paid conversion, paid-plan switches (cancels old sub), same-plan no-op
- ✅ `/api/webhooks` — maps Stripe price_id → plan_type, stale-ID guard on delete events, syncs trial_end + cancel_at_period_end, handles `checkout.session.completed` for one-time invoice payments
- ✅ `/api/billing-portal` — opens Stripe billing portal for customers with active subscription
- ✅ `/api/subscription/auto-trial` — creates 14-day trial on first dashboard visit
- ✅ `/pricing` page with working "Upgrade to Starter/Pro" buttons → Stripe Checkout → back to `/checkout-success`
- ✅ `/checkout-success` and `/checkout-cancel` landing pages with webhook-race polling mitigation
- ✅ Dashboard settings billing tab — shows current plan, trial countdown, credit usage bar, Manage Billing button, upgrade/switch CTAs
- ✅ One-time payment links per invoice (`createOneTimeCheckoutSession`) with `/invoice-paid` and `/invoice-canceled` public landing pages

**Invoicing (v1)**
- ✅ Schema: `invoices`, `invoice_line_items`, `payments` tables with RLS, YYYY-MM-NNNN per-user numbering
- ✅ `lib/invoices.ts` data layer with CRUD + totals + status transitions
- ✅ `/dashboard/financials` — list with search, status filter, empty state, row actions
- ✅ `/dashboard/financials/new` — create invoice form with line items, live totals, client/project dropdowns, tax rate
- ✅ `/dashboard/financials/[id]` — detail view + inline edit + Mark sent / Mark paid / Download PDF / Get payment link / Delete actions, payment history
- ✅ Branded PDF export via `@react-pdf/renderer` at `/api/invoices/[id]/pdf`
- ✅ Stripe one-time payment link at `/api/invoices/[id]/payment-link` with automatic webhook-driven status update on payment

**Code quality**
- ✅ No `as any` casts in active code (4 `: any` annotations remain in places where types genuinely can't be narrowed — acceptable)
- ✅ All debug `console.log` calls guarded by `process.env.NODE_ENV === 'development'`
- ✅ `console.error` calls intentionally unguarded (correct for production)

### Known broken / placeholder

- 🔴 **`/dashboard/mood-boards`** — 38-line "Coming Soon" stub
- 🔴 **`/dashboard/analytics`** — 38-line "Coming Soon" stub
- 🔴 **`app/contact/page.tsx`** — submit handler is `// TODO: Wire up to Resend or backend endpoint` then `alert(...)`. Resend package is installed (`resend@3.2.0`) but never imported.
- 🔴 **Chat memory / chat history panel** — chat messages are NOT persisted across sessions. `ai_messages` table only stores token-usage analytics (model, category, credits_cost, tokens) — not actual message content.
- 🔴 **`GOOGLE_AI_API_KEY`** missing from `.env.local` (added to Vercel) — image gen probably broken locally
- 🔴 **`SUPABASE_SERVICE_ROLE_KEY`** missing from `.env.local` (added to Vercel) — admin-side server code probably broken locally
- 🔴 **Mobile responsiveness** — desktop-first; sidebar/chat panel/tables not adapted for small screens
- 🔴 **Dark mode** — light mode only

### Known cosmetic / cleanup

- 🟡 `netlify.toml` — vestigial from a previous Netlify deployment. Vercel ignores it. Safe to delete whenever.
- 🟡 Code references env vars `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` and `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY` that don't exist in `.env.local` or Vercel — likely dead refs from older naming. Worth grepping and cleaning.

---

## Next Up

The numbered list below is the **strict order** to work in. Top = next task. Each task is small enough to ship a focused commit.

### 1. ~~Wire up Stripe upgrade flow~~ ✅ DONE (2026-04-07)
Shipped in commit TBD. Working Stripe upgrade flow for Free / Starter ($29/mo) / Pro ($79/mo). Studio tier deferred due to naming conflict with product name "IDStudio" — a third paid tier will come back later under a different name. Delivered:
- Fixed `/api/checkout`: same-plan no-op, cancels old Stripe sub on paid-plan switches, no second trial on upgrade, defaults success/cancel URLs
- Fixed `/api/webhooks`: maps Stripe price_id → plan_type, syncs trial_end and cancel_at_period_end, stale-ID guard on delete events
- Shared `lib/checkout.ts` client helper used by both pricing page and settings
- Rewrote `components/PricingCards.tsx` with warm-neutral design, 4-state button logic (start/upgrade/switch/current), Framer Motion stagger
- New `/checkout-success` and `/checkout-cancel` landing pages with polling for webhook race mitigation
- Rewrote billing tab in `/dashboard/settings` with real subscription state, trial countdown, credit usage bar, Manage Billing button

### 2. ~~Replace `/dashboard/financials` placeholder with v1 invoicing~~ ✅ DONE (2026-04-07)
Shipped end-to-end invoicing: list, create, edit, delete, mark sent/paid, PDF export, and Stripe one-time payment links. Per BUILD-PLAN scope, expense tracking / budget tools / business financials remain deferred. Delivered:
- **Schema** (Sections 15/16/17 in `supabase/setup.sql`): `invoices`, `invoice_line_items`, `payments` with RLS + indexes. **Ryan must run the new SQL block in Supabase SQL Editor** before the feature can be used — see note in STRIPE-SETUP.md or run `supabase/setup.sql` idempotently.
- `lib/invoices.ts` (new): full data layer — `listInvoices`, `getInvoice`, `createInvoice`, `updateInvoice`, `deleteInvoice`, `markInvoiceSent`, `markInvoicePaid`, `generateInvoiceNumber` (YYYY-MM-NNNN format), `computeInvoiceTotals` (pure), `getDisplayStatus` (overdue derivation), `listPaymentsForInvoice`.
- `lib/stripe.ts`: added `createOneTimeCheckoutSession` helper using `mode: 'payment'` with invoice metadata for webhook correlation.
- `app/api/webhooks/route.ts`: extended with `checkout.session.completed` handler (guarded to `session.mode === 'payment'`) that inserts a payments row and flips the invoice to paid — with idempotency guard for Stripe retries.
- `app/api/invoices/[id]/pdf/route.tsx`: renders a branded PDF via `@react-pdf/renderer` (Node runtime, Helvetica, warm-neutral color tokens). Supports `?download=1` for attachment vs inline.
- `app/api/invoices/[id]/payment-link/route.ts`: creates a fresh Stripe Checkout one-time session per click. Resolves Stripe customer from the linked client's email (with helpful error messages if missing). Rate-limited to 10/min.
- `components/invoices/InvoicePDF.tsx` (new): @react-pdf/renderer component with letter-size layout, bill-to block, line items table, totals block, notes/terms, footer.
- `components/invoices/InvoiceStatusBadge.tsx` (new): status-to-shadcn-Badge-variant mapping with built-in overdue derivation.
- `components/invoices/InvoiceLineItemRow.tsx` (new): controlled-input line item editor with live amount.
- `components/invoices/InvoiceForm.tsx` (new): shared create + edit form. Live totals via `useMemo`. Client/project dropdowns filtered by selection. Validation for empty items, negatives, bad dates, bad tax rates. Inline errors.
- `app/dashboard/financials/page.tsx` (rewrite): list view with search (invoice # + client name), status filter, empty state, row actions (view, download PDF, get payment link, delete).
- `app/dashboard/financials/new/page.tsx` (new): dedicated create route hosting the InvoiceForm.
- `app/dashboard/financials/[id]/page.tsx` (new): detail view + inline edit (full form swap) + actions (Mark sent, Mark paid dialog, Download PDF, Get payment link with inline success card, Delete). Payment history section.
- `app/invoice-paid/page.tsx` (new): public branded "Payment received" landing after Stripe success.
- `app/invoice-canceled/page.tsx` (new): public "Payment canceled" landing.
- `@react-pdf/renderer@4.4.0` added as a dependency.

### 3. Replace `/dashboard/mood-boards` placeholder with drag-and-drop builder
Per PRODUCT-PLAN MODULE 5. Highest emotional value for designers — they judge the platform by this.
- Schema: `mood_boards`, `mood_board_items` tables with RLS
- UI: list mood boards (one per project optional), create board, drag-and-drop canvas using `@dnd-kit/core` (already installed)
- Support items: image uploads, clipped products from sourcing library, color swatches, text notes
- Save layout (x, y, w, h, rotation per item)
- Defer: AI mood board generator, background removal, Canva integration, color palette extraction

### 4. Replace `/dashboard/analytics` placeholder with project profitability v1
The most actionable metric for solo designers. Per PRODUCT-PLAN MODULE 9A "Profitability per project".
- Combine: invoices billed (from #2) + AI usage cost + manual time entries
- Simple table: project name | hours logged | revenue | est. cost | margin
- Defer: Recharts visualizations, business-wide P&L, forecasting

### 5. Set up testing framework + tests for critical auth flows
Foundational. Catches regressions before users do.
- Install Vitest + React Testing Library + `@testing-library/jest-dom` + `@testing-library/user-event` + msw
- Tests: login → session created; middleware unauth redirect; signup → trial subscription created via webhook
- Tests: `/api/chat` rate limiting + credit checks + tool execution; `/api/credits`; `/api/webhooks` Stripe signature verification
- Tests: AuthProvider context, dashboard data fetching, AIChatPanel send-message
- `npm test` should pass green

### 6. Wire up Resend for transactional email
Package already installed. Lots of leverage for very little code.
- `lib/resend.ts` — initialize client, helper `sendEmail({to, subject, html})`
- `/api/email/send` — generic POST endpoint (server-side, auth-gated)
- Wire `app/contact/page.tsx` submit handler to `/api/email/send` (replace the `alert(...)`)
- Welcome email on signup (trigger from webhook or `AuthProvider`)
- Style the Supabase password-reset email template

### 7. Persist chat conversations + add chat history panel
The README "AI Chat — Future Revisions" section. Lifts retention massively.
- Schema: `chat_conversations` and `chat_messages_full` tables (current `ai_messages` stays for analytics)
- API: `/api/chat` writes user + assistant messages + tool calls to `chat_messages_full`
- Load conversation history on chat panel mount
- Expandable history sidebar (right of chat panel) listing past conversations, searchable, click to reload

### 8. Mobile responsiveness pass
Desktop-first → fully responsive.
- Sidebar collapses to hamburger on `<lg`
- Stack dashboard cards vertically on `<sm`
- AI chat panel becomes slide-over / bottom sheet on `<md`
- All tables → responsive list/card view on `<md`
- Min 44px touch targets on all interactive elements

### 9. Onboarding wizard at `/onboarding`
First-impression feature. Triggered after first signup.
- Step 1: upload logo, pick brand colors
- Step 2: create first client
- Step 3: create first project
- Step 4: try AI chat (guided first message)
- "Skip" option always visible
- Mark `profiles.onboarded_at` on completion; `AuthProvider` redirects to `/onboarding` if null

### 10. Dark mode
- Add `next-themes`
- Toggle in settings + navbar
- Audit shadcn/ui + custom components for dark backgrounds (AIChatPanel, project detail, sourcing)

### 11. Pre-launch deployment polish
- Re-verify `next build` zero-error
- Grep for leaked secrets (`sk_live`, `service_role`)
- Configure Stripe webhook for production URL
- Configure Supabase auth redirect URLs for `app.idstudio.ai`
- Set up `app.idstudio.ai` DNS via Hostinger → Vercel
- Add SEO meta tags + OG images to all public pages
- Add `sitemap.xml`, `robots.txt`
- Install Sentry for error tracking
- Add Google Analytics 4
- Build/polish marketing landing page at `/` (hero, features, pricing, testimonials, CTA)

### 12. Pricing tier enforcement
- Enforce active-project limits per plan (Free=1, Starter=3, Pro=∞)
- Enforce AI credit limits per plan (Free=7/wk, Starter=50, Pro=200)
- Soft paywall: in-app upgrade prompts when limits hit

---

## Pre-Launch Required

These must ship before the public launch (whether they come from Next Up or are added later):
- Stripe upgrade flow working (item #1)
- At least one of mood boards / financials / analytics no longer a placeholder (items #2–#4)
- Tests for auth + Stripe webhook (item #5)
- Welcome email on signup (item #6)
- Mobile responsiveness (item #8)
- Onboarding wizard (item #9)
- Marketing landing page (item #11)
- DNS, SEO, Sentry, GA (item #11)

Everything else is nice-to-have.

---

## Post-Launch Backlog

These are real features but **do not build before launch**. Order within each section is rough — re-prioritize based on which paying users ask for what.

### Dashboard polish
- Notification center
- Global search across projects, clients, files, products
- Multi-team collaboration (invite seats, roles: owner/designer/assistant/viewer)

### Client management deep dive
- Branded client portal (separate login per client) — see `reference/db-prisma/prisma/migrations/003_client_portal/migration.sql` for schema starting point
- Client intake questionnaire builder
- Client approval workflow (approve/reject/comment on selections, room-by-room sign-off)
- Client activity feed for designer
- Digital signatures (e-sign contracts)

### AI proposal & document deep dive
See `reference/ai-worker/src/prompts/v1/proposalGeneration.ts` for prompt structure.
- AI email drafting tool in chat panel
- Change order generation
- Letter of agreement builder
- Mood board → proposal → FF&E schedule auto-pipeline

### Project management deep dive
- Gantt chart view (in addition to existing kanban)
- Time tracking per task
- Calendar integration with Google Calendar
- Daily/weekly project logs
- Team capacity & hour tracking (workload bars, utilization, overwork alerts) — PRODUCT-PLAN-archive MODULE 4B

### Mood boards & creative deep dive
- AI mood board generator (text → board)
- Background removal for clipped product images
- Canva connector (push/pull boards)
- Color palette extraction
- Material pairing suggestions
- Client presentation mode (full-screen branded slideshow)
- Room-by-room organization

### AI image rendering
See `reference/ai-worker/src/prompts/v1/geminiImageGeneration.ts` and `src/workers/geminiImageGeneration.ts` for prompt + worker pattern. Use Trigger.dev or Inngest, NOT raw Redis.
- Text-to-room render via Gemini Nano Banana 2
- Style transfer (photo + style → render)
- Reference image consistency across multiple renders
- Render gallery with before/after sliders

### Sourcing & FF&E deep dive
- Browser extension product clipper (Chrome) — MV3, content script, injects "Clip to IDStudio" button
- Vendor contact management
- Markup calculator with client-pricing toggle
- AI product search ("find me a 72-inch walnut sideboard under $3,000")
- Auto-generated FF&E schedule PDF

### Procurement
- Purchase order generation from FF&E
- Multi-vendor order tracking dashboard
- Receiving log with damage flagging
- Installation tracking
- Budget vs. actual with AI forecasting

### Financial deep dive (beyond v1 invoicing)
- Per-project budget builder by category
- Real-time cost tracking from POs/expenses
- Business budget tool (income, expenses, forecasting)
- QuickBooks two-way sync
- Tax-ready reporting

### AI knowledge base
- Project-aware chatbot (RAG over project documents)
- Document embedding & ingestion
- Cross-project search ("show me every project where I used Calacatta")
- Decision history log

### Floor plan AI
- Floor plan upload + dimension extraction
- Space planning suggestions
- Code compliance checks
- Lighting analysis

### Marketing automation
- AI blog post generator
- AI newsletter builder (Resend)
- Social media caption generator
- Portfolio page builder

### Strategic vision features
See `FUTURE-GROWTH-FEATURES-archive.md` for the full strategic vision document. High-level categories:
- The Client Experience Moat (real-time project room, decision hub, automated client updates)
- The Design Intelligence Engine (AI design DNA, vendor price intelligence, project cost predictor)
- The Visual Creative Suite (shoppable mood boards, AR room preview, 3D space planning)
- The Business Command Center (profitability autopilot, smart pricing, pipeline forecasting)
- The Procurement Powerhouse (universal clipper 2.0, trade account aggregator, freight calculator)
- Network Effect features (designer marketplace, vendor reviews, referral network, template store)
- Installation & job site tools (photo documentation, punch list, contractor coordination)
- Designer growth engine (portfolio builder, SEO autopilot, lead qualification AI)

These are the long-term moat. Build only after the MVP has paying customers and you know which one they actually want.

---

## Won't Build (Out of Scope)

- Native mobile app (the responsive web app is the mobile experience for now)
- Desktop app (Electron / Tauri) — `reference/` has Tauri scaffolding from the abandoned monorepo branch if you ever revive this
- Monorepo migration to Fastify/Turborepo/separate AI worker — see `reference/README.md` for why
- Anything from `FUTURE-GROWTH-FEATURES-archive.md` before the MVP ships

---

## Reference Material

When working on a task, check these for prior art before writing fresh code:

| Working on… | Check… | Why |
|---|---|---|
| New AI tool in `/api/chat` or expanding doc generation | `reference/ai-worker/src/prompts/v1/` | Pre-written Claude prompts for proposals, design suggestions, budget forecasting, scheduling, image gen |
| New Supabase table or RLS policy | `reference/db-prisma/prisma/` | Schema design for tenants, projects, tasks, budgets, vendors, client portal + reusable RLS patterns |
| Client portal (item in Post-Launch) | `reference/db-prisma/prisma/migrations/003_client_portal/` | Schema starting point |
| Gemini image generation (Post-Launch) | `reference/ai-worker/src/prompts/v1/geminiImageGeneration.ts` + `src/workers/geminiImageGeneration.ts` | Prompt + worker pattern (use Trigger.dev/Inngest, not raw Redis) |
| Long-running AI jobs >60s (Post-Launch) | `reference/ai-worker/` whole tree | Worker + queue patterns, but use Trigger.dev or Inngest |

Full inventory: `reference/README.md`.

For high-level product context (not build order): `PRODUCT-PLAN-archive.md`.
For long-term strategic vision: `FUTURE-GROWTH-FEATURES-archive.md`.
