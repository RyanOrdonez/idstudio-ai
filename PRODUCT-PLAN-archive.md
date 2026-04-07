# IDStudio — Full Product Plan (ARCHIVED)

> **ARCHIVED 2026-04-07.** This file is no longer the source of truth for what to build.
> The active build queue is in [BUILD-PLAN.md](./BUILD-PLAN.md).
> Read this file for product vision, design philosophy, feature descriptions, and pricing strategy — but **do not use it for build ordering**. The "4-Week Build Schedule" and module numbering below are historical and were never followed in practice.
>
> If you're an AI assistant: do not start work from this file. Start from BUILD-PLAN.md.

---

## Context

We're building an AI-powered interior design business platform at **idstudio.ai** — the all-in-one daily operating system for interior designers. The goal is $20-30k/month recurring revenue targeting solo designers and small firms (1-10 people).

**Why this wins:** Every competitor either does business tools (no creative) or creative tools (no business). Nobody connects creative design to business operations with native AI. 85% of designers use 8-15 separate tools that don't talk to each other. We replace the franken-stack.

**The wife advantage:** Ryan's wife is an interior designer currently using DesignFiles + the full stack of scattered tools. She's our first user, tester, and credibility source.

**AI philosophy:** Subtle adoption. AI handles admin/tedious work. AI assists creative work when asked. AI never overrides the designer or talks directly to clients. Frame: "AI that gives you back 10 hours a week to focus on design."

---

## Design-First Philosophy — The #1 Selling Point

**Interior designers judge tools by how they look.** If IDStudio doesn't feel as beautiful as the spaces they create, they won't use it — no matter how powerful the features are. Every screen, every interaction, every PDF output must feel like it was designed by a designer, for designers.

### Core Design Principles
1. **Visual elegance over feature density** — generous whitespace, refined typography, thoughtful color palette. Never feel cluttered or "techy." Every screen should feel like opening a high-end design magazine.
2. **Presentation-ready outputs** — every document, proposal, mood board, invoice, and client-facing view must be beautiful enough to present as-is. No ugly default templates. Designers shouldn't need to export to Canva to make things look good.
3. **Brand-forward client experience** — the client portal, proposals, invoices, and presentations all carry the designer's brand (logo, colors, fonts). Their clients should feel like they're using the designer's own custom platform.
4. **Curated aesthetic, not generic SaaS** — avoid the typical dashboard look (blue/gray, data-heavy tables). Use warm neutrals, editorial typography, subtle textures, and intentional micro-animations. Think Squarespace meets Notion meets a design portfolio.
5. **Beautiful data visualization** — charts, budgets, timelines, and dashboards should be visually stunning. Use elegant chart styles, muted palettes, and clean layouts. Numbers should feel approachable, not intimidating.
6. **Tactile, delightful interactions** — smooth drag-and-drop, satisfying hover states, fluid page transitions, and thoughtful loading states. The app should feel premium to use.
7. **Dark mode & light mode** — both polished and intentional, not an afterthought. Dark mode should feel like a luxury experience.
8. **Mobile-first beauty** — the mobile experience should be just as refined as desktop. Job site use on a phone should still feel elegant.

### Design System Specifics
- **Typography**: Elegant sans-serif for UI (e.g., Satoshi, General Sans, or similar). Serif accent font for headings/titles to give editorial warmth.
- **Color palette**: Warm neutrals as base (cream, soft stone, warm gray) with one sophisticated accent color. Avoid pure white backgrounds — use off-white/cream for warmth.
- **Iconography**: Custom or premium icon set (Phosphor, Lucide) — consistent stroke weight, rounded feel.
- **Photography/imagery**: When showing placeholder or sample content, use aspirational interior design imagery. The app should always look like it lives in the design world.
- **Spacing & layout**: Generous padding, intentional grid. Every element breathes. Dense data views available as an option, but default views prioritize beauty.
- **Component style**: Soft shadows, subtle rounded corners, layered cards with depth. Glass-morphism touches where appropriate. Nothing flat or harsh.
- **Animations**: Framer Motion for page transitions, micro-interactions on buttons/cards, smooth parallax on marketing pages. Fast but noticeable — the app should feel alive.
- **Print/PDF output**: All generated documents (proposals, invoices, FF&E schedules, budgets) use beautiful layouts with the designer's branding. Export quality should rival InDesign output.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Fast to build, great SEO for marketing site, server components |
| Database | **Supabase (PostgreSQL + Auth + Storage + Realtime)** | Auth, DB, file storage, realtime updates — one service |
| Styling | **Tailwind CSS + shadcn/ui + custom design system** | Heavily customized — warm neutrals, editorial typography, premium feel. Not default shadcn. |
| Animations | **Framer Motion** | Smooth page transitions, micro-interactions, drag-and-drop polish |
| Typography | **Satoshi + serif accent (e.g., Playfair Display)** | Editorial warmth — sans-serif UI, serif headings. Feels like a design magazine. |
| AI - Text | **Claude API (Anthropic)** | Proposals, chatbot, emails, blog/newsletter generation |
| AI - Images | **Google Gemini (Nano Banana 2)** | Latest Gemini image model — concept renders, mood boards, style exploration, consistency across renders |
| Payments | **Stripe** | Subscriptions, invoicing, payment processing |
| Email | **Resend** | Transactional emails, newsletter sending |
| Hosting | **Vercel** | Easy deploys, edge functions, preview deployments. Domain: app.idstudio.ai via Hostinger DNS |
| Desktop App | **Electron or Tauri** | Downloadable desktop version wrapping the web app |
| State Mgmt | **Zustand** | Lightweight client state |
| Forms | **React Hook Form + Zod** | Form handling + validation |

---

## Feature Map (Complete Product)

### MODULE 1: Dashboard & Core
- **Home dashboard** — editorially-styled overview: today's tasks, upcoming deadlines, project status with beautiful card layouts, hero project image, and at-a-glance metrics. Should feel like opening a curated design feed, not a spreadsheet.
- **Persistent AI chat panel** — always visible on the right side of every page. Can expand to full screen or minimize to just a tab. The designer can ask the AI anything from any screen — draft an email, search a product, generate a render — without leaving their current context.
- **Multi-project management** — gallery-style project grid with large cover images, elegant filtering/sorting. List view available but gallery is default — designers think visually.
- **Team management** — invite team members, assign roles (owner, designer, assistant, viewer)
- **Notification center** — clean, minimal notification panel with subtle animations
- **Global search** — instant, beautiful search with rich previews (product thumbnails, project covers, client avatars)
- **Mobile-responsive** — fully polished mobile experience for job site use. Not a shrunk desktop — a designed mobile experience.

### MODULE 2: Client Management & Portal
- **Client database** — contact info, project history, preferences, notes — each client has a styled profile card
- **Client intake questionnaire** — beautifully designed intake form that matches the designer's brand. Feels like a luxury experience for the client, not a Google Form. AI analyzes responses to extract preferences and flag conflicts.
- **Branded client portal** — the crown jewel. Clients get their own login with the designer's logo, colors, and fonts. Every page — approvals, mood boards, invoices — looks like the designer built a custom app for them. This is what makes designers recommend IDStudio to each other.
- **Full approval workflow** — elegant side-by-side product views with approve/reject buttons, comment threads, room-by-room sign-off. Clients should enjoy using this.
- **Client activity feed** — designer sees all client actions in a clean, styled timeline
- **Digital signatures** — e-sign contracts and change orders with a polished signing experience

### MODULE 3: AI Proposal & Document Generation
- **AI proposal writer** — input project scope/brief, AI generates a beautifully typeset proposal in the designer's voice and brand. Exported PDFs rival InDesign-quality layouts with cover pages, styled sections, and professional formatting. Learns from past proposals.
- **Contract templates** — pre-built industry-standard contracts (ASID-style) with elegant formatting. Customizable fonts, colors, and layout to match the designer's brand.
- **AI email drafting** — context-aware email suggestions for client updates, vendor follow-ups, meeting recaps
- **Change order generation** — AI drafts change orders from conversation notes, outputs as branded PDF
- **Letter of agreement builder** — scope, fees, payment schedule, terms — all beautifully formatted

### MODULE 4: Project Management & Scheduling
- **Project phases** — customizable phases (concept, schematic, design development, procurement, installation)
- **Gantt chart view** — elegantly styled visual timeline with color-coded phases, smooth drag-and-drop, milestone markers. Not a boring Excel-style Gantt — a designer-worthy timeline.
- **Task management** — create, assign, due dates, priority, status. Kanban board with beautiful cards (project thumbnails, avatars, color tags) + clean list view.
- **Time tracking** — per-project, per-task timer with AI profitability analysis
- **Calendar integration** — sync with Google Calendar for site visits, client meetings
- **Daily/weekly project logs** — track decisions, changes, site visit notes

#### 4B: Team Capacity & Hour Tracking
- **Team workload dashboard** — beautifully visualized capacity bars for each team member showing hours, projects, and availability. Color-coded: green (healthy), amber (busy), red (overloaded). At-a-glance clarity.
- **Capacity planning** — before taking on a new project, see if the team has bandwidth or if it would stretch people too thin
- **Utilization rate per person** — track billable vs. non-billable hours, flag overworked employees (>85% utilization) and underutilized ones (<50%)
- **Project staffing forecaster** — AI estimates hours needed for a new project based on similar past projects, shows impact on team capacity
- **Underwork alerts** — if pipeline is light and employees are underutilized, flag the need to reduce hours or find new projects
- **Overwork alerts** — if a project would push team members past their weekly hour limits, warn before committing
- **Hour allocation planner** — drag-and-drop weekly hour blocks per person across projects
- **Overtime & burnout tracking** — flag team members consistently working over their target hours
- **Contractor vs. hire analysis** — AI recommends: "This project needs 40 extra hours/week for 3 months — cheaper to hire a contractor than a full-time employee"

### MODULE 5: Mood Boards & Design Presentations
- **Drag-and-drop mood board builder** — fluid, gorgeous canvas for arranging products, images, colors, materials, and text. Smooth Framer Motion animations on drag. Auto-layout suggestions for balanced compositions. Multiple layout templates (grid, freeform, editorial).
- **AI mood board generator** — describe a concept in text, AI proposes a visually curated initial board with images and products arranged in a polished layout
- **Canva integration** — Claude-powered Canva connection to pull existing mood boards into IDStudio or push/save IDStudio boards to the user's Canva account. Best of both worlds.
- **Product clipper** — browser extension to clip products from any vendor website (image, price, specs, URL). Clipped images auto-cleaned with background removal.
- **Background removal** — AI auto-removes backgrounds from product images for clean, professional board compositions
- **Client presentation mode** — full-screen, branded slideshow with elegant transitions, presenter notes, and room-by-room navigation. Designed to wow clients in meetings. Shareable via link with the designer's branding.
- **Room-by-room organization** — organize boards by room/space with beautiful thumbnail navigation
- **Color palette extraction** — AI extracts and suggests harmonious palettes from inspiration images, displayed as elegant swatch strips
- **Material pairing suggestions** — AI suggests complementary materials with visual previews side-by-side

### MODULE 6: AI Concept Rendering
- **Text-to-room render** — describe a concept, get stunning AI-generated room visualization via Nano Banana 2. High-resolution output suitable for client presentations.
- **Style transfer** — upload room photo, apply different design styles (modern, Japandi, coastal, mid-century, etc.) with a beautiful style picker showing real reference images for each aesthetic
- **Photo-to-render enhancement** — take a basic job site photo and transform it into a polished, presentation-quality render
- **Reference image consistency** — use Gemini's Nano Banana 2 model for maintaining design elements across multiple renders of the same space
- **Render gallery** — save, organize, compare renders in a beautiful lightbox gallery. Before/after sliders for style transfers. Clients can view in the portal.
- **Quick concept exploration** — generate 3-4 style directions in minutes, presented as an elegant comparison grid for client discussion

### MODULE 7: Product Sourcing & FF&E
- **Product database** — save products with large thumbnail images, full specs (dimensions, price, vendor, lead time, SKU, finish options). Gallery view as default — designers browse visually, not in tables.
- **AI product search** — "Find me a 72-inch walnut sideboard under $3,000" — results displayed as a beautiful product grid with images, not a text list
- **FF&E schedule auto-generation** — automatically builds a presentation-ready specification schedule from design selections. Exports as a beautifully formatted, branded PDF.
- **Vendor contact management** — track vendor reps, trade accounts, discount tiers
- **Product comparison** — elegant side-by-side comparison with large images, spec highlights, and price comparison
- **Markup calculator** — set markup percentages, auto-calculate client pricing with clean visual breakdown

### MODULE 8: Procurement & Order Tracking
- **Purchase order generation** — create POs from FF&E selections, auto-populate vendor info
- **Order status dashboard** — track every order across all vendors (ordered, shipped, received, installed)
- **AI procurement alerts** — flag delayed orders, suggest alternatives for out-of-stock items
- **Receiving log** — check items in at receiving warehouse, flag damage
- **Installation tracking** — track what's been installed vs. what's pending per room
- **Budget vs. actual** — real-time budget tracking with AI forecasting ("project is tracking 12% over budget")

### MODULE 9: Financial Tools & Budgeting

#### 9A: Project Budget Tool
- **Per-project budget builder** — set budget by category (furniture, materials, labor, shipping, contingency) with a clean, visual layout
- **Real-time cost tracking** — every PO, expense, and invoice auto-updates the budget with smooth animated counters
- **Budget vs. actual dashboard** — stunning visual breakdown with elegant donut/bar charts showing where money is going, color-coded over/under indicators. Designers should actually want to look at their budgets.
- **Cost alerts** — automatic warnings when a category or total is approaching/exceeding budget
- **Change order cost impact** — see how scope changes affect the project budget before approving
- **Client-facing budget view** — share a beautifully branded budget summary with clients (markup applied, styled to match the designer's brand). Should look like a document from a luxury firm, not a QuickBooks printout.
- **Profitability per project** — P&L showing design fees earned vs. time invested, margin analysis

#### 9B: Business Budget Tool
- **Income & expense overview** — monthly/quarterly/annual view with gorgeous area charts, trend lines, and visual summaries. Should feel like a beautifully designed annual report, not an accounting app.
- **Revenue forecasting** — AI projects future revenue based on pipeline, signed contracts, recurring clients. Displayed as elegant projected trend lines.
- **Expense categorization** — rent, software, labor, marketing, insurance, etc. with styled category cards and visual trend sparklines
- **Hiring/downsizing analysis** — AI calculates: "Based on current revenue and pipeline, you can afford to hire 1 more designer" or "Revenue is trending down — consider reducing hours for part-time staff." Presented as clear, actionable insight cards.
- **Break-even calculator** — visual gauge showing minimum monthly revenue needed to cover all fixed costs
- **Cash flow projections** — forecast upcoming inflows (client payments) vs. outflows (vendor bills, payroll) as a beautiful waterfall chart
- **Staff cost modeling** — interactive scenario builder: "What if I hire a junior designer at $55K? How does that change my margins?" with before/after visual comparison

#### 9C: General Financial Tools
- **Invoicing** — create and send beautifully branded invoices that match the designer's aesthetic. No generic invoice templates — these should look like they came from a luxury firm.
- **Payment processing** — accept credit card and ACH payments via Stripe
- **Deposit & retainer tracking** — manage design fee deposits and product deposits separately
- **Expense tracking** — log project expenses, categorize by type
- **QuickBooks integration** — two-way sync for firms already using QuickBooks
- **Tax-ready reporting** — export financial data for accountant

### MODULE 10: AI Content & Marketing
- **AI blog post generator** — input topic or keywords, AI generates SEO-optimized blog post drafts
- **AI newsletter builder** — weekly/monthly newsletter from project updates, design tips, curated content
- **Social media captions** — AI generates Instagram/Pinterest captions from project photos
- **Portfolio page builder** — showcase completed projects with before/after, descriptions

### MODULE 11: AI Project Knowledge Base (Chatbot)
- **Project-aware AI chatbot** — ask questions about any project: "What backsplash did we pick for the Johnson kitchen?"
- **Document ingestion** — upload project docs, contracts, meeting notes — AI indexes everything
- **Cross-project search** — "Show me all projects where we used Calacatta marble"
- **Decision history** — AI maintains a log of all design decisions with context and dates
- **Smart suggestions** — based on past projects, AI suggests products/approaches that worked well

### MODULE 12: AI Floor Plan & Space Analysis
- **Floor plan upload & digitization** — upload a PDF/image floor plan, AI extracts room dimensions
- **Space planning suggestions** — AI suggests furniture layouts based on room dimensions and function
- **Code compliance flags** — AI checks clearances, ADA requirements, egress paths
- **Traffic flow analysis** — AI highlights potential circulation issues
- **Lighting analysis** — basic AI assessment of natural light, fixture placement suggestions
- **Electrical/plumbing notation** — mark up floor plans with electrical outlets, plumbing locations, HVAC vents

---

## Pricing Tiers

| Tier | Price | Target | Key Features |
|---|---|---|---|
| **Free** | $0/mo | Anyone exploring | 1 active project, limited AI (5 proposals/mo), basic mood boards, basic PM. 14-day trial of Professional tier included on signup. |
| **Starter** | $49/mo | Solo designers starting out | 3 active projects, AI proposals (10/mo), mood boards, basic PM, invoicing |
| **Professional** | $149/mo | Established solo designers | Unlimited projects, full AI suite, client portal, procurement tracking, chatbot |
| **Studio** | $299/mo | Small firms (2-5 people) | Everything + 3 team seats, AI renderings (50/mo), QuickBooks sync, priority support |
| **Enterprise** | $499/mo | Larger firms (5-10+) | Everything + unlimited seats, custom branding, API access, dedicated onboarding |

**Free tier** stays forever with limited features. Every new signup gets a **14-day trial of Professional** so they experience the full product before deciding.

Annual billing: 20% discount (e.g., Pro = $119/mo billed annually)

---

## Database Schema (Key Tables)

```
users, teams, team_members
clients, client_questionnaires
projects, project_phases, project_tasks
mood_boards, mood_board_items
products, product_sources, ffe_schedules
purchase_orders, po_line_items, order_tracking
invoices, invoice_line_items, payments
proposals, contracts, documents
renders, render_gallery
blog_posts, newsletters
chat_messages (AI chatbot history)
notifications
time_entries
```

---

## 4-Week Build Schedule

### WEEK 1: Foundation + Core Business
**Days 1-2: Project Setup + Design System Foundation**
- Initialize Next.js 14 project with App Router
- Configure Supabase (auth, database, storage)
- Set up Stripe integration
- **Build custom design system** — customize shadcn/ui with warm neutral palette, Satoshi + serif typography, custom component styles (cards, buttons, inputs, modals). Every component should feel premium from day one. Set up Framer Motion defaults for page transitions and micro-interactions.
- Deploy to Vercel, connect idstudio.ai domain
- Set up database schema (all tables)

**Days 3-4: Auth + Dashboard + Client Management**
- User registration/login (email + Google OAuth)
- Team creation and member invites
- Main dashboard layout with sidebar navigation
- Client database CRUD
- Client intake questionnaire builder

**Days 5-7: Project Management**
- Project CRUD with phases
- Task management (kanban + list view)
- Gantt chart view (use a library like @neodrag or build with d3)
- Time tracking per project/task
- Calendar view with Google Calendar sync

### WEEK 2: AI Features + Creative Tools
**Days 8-9: AI Proposal & Document Generation**
- Claude API integration
- Proposal generator (input brief -> AI generates proposal)
- Contract template system
- AI email drafting
- Change order generation

**Days 10-11: Mood Boards**
- Drag-and-drop mood board builder (use dnd-kit or similar)
- Product clipper browser extension (Chrome)
- AI background removal for product images
- AI mood board generator (text -> board suggestions)
- Color palette extraction

**Days 12-14: AI Rendering + Knowledge Base**
- Google Gemini API integration (Nano Banana 2 image model)
- Text-to-room rendering
- Style transfer (photo + style -> new render)
- Render gallery and organization
- AI chatbot with project context (Claude API + document embeddings)
- Document upload and indexing

### WEEK 3: Business Operations + Client Portal
**Days 15-16: Product Sourcing & FF&E**
- Product database with full spec fields
- AI product search
- FF&E schedule auto-generation
- Vendor management
- Markup calculator

**Days 17-18: Procurement & Orders**
- Purchase order generation from FF&E
- Order tracking dashboard (multi-vendor)
- Receiving log and damage flagging
- Installation tracking
- Budget vs. actual with AI forecasting

**Days 19-21: Client Portal + Financials**
- Branded client portal (separate login flow)
- Approval workflow (approve/reject/comment on selections)
- Client activity feed
- Invoicing system
- Payment processing (Stripe)
- Deposit/retainer tracking
- Basic financial reports

### WEEK 4: Content, Analysis, Polish
**Days 22-23: AI Content & Marketing**
- Blog post generator
- Newsletter builder with Resend
- Social media caption generator
- Portfolio showcase pages

**Days 24-25: Floor Plan Analysis**
- Floor plan upload and AI digitization
- Space planning suggestions
- Basic code compliance checks
- Lighting and electrical markup tools

**Days 26-28: Polish, Testing, Launch**
- **Marketing landing page** at idstudio.ai — this is the first impression. Must be stunning. Cinematic hero, scroll animations, aspirational imagery.
- **Onboarding flow** — guided, beautiful walkthrough that lets designers set up their brand (upload logo, pick colors, choose fonts) in the first 2 minutes. First impression of the app must wow.
- **Design polish pass** — review every screen for visual consistency, spacing, typography, animations. No ugly corners.
- Mobile responsiveness pass — ensure beauty carries to every screen size
- Performance optimization
- Bug fixes from wife's testing
- Stripe subscription tiers setup
- Launch!

---

## Marketing Landing Page Structure

The landing page itself must be the proof. If a designer visits idstudio.ai and the page isn't gorgeous, they'll never sign up. The marketing site should be as beautiful as the product.

```
Hero: Cinematic, full-width hero with an aspirational interior design render.
       "The Operating System for Interior Designers"
       "Run your entire design business — from concept to install — in one beautiful platform."
       CTA: "Start Free Trial" (elegant button, not aggressive)

Section 1: The Problem — visual showing 10+ scattered tool logos vs. one IDStudio logo
Section 2: Product showcase — large, gorgeous screenshots of key screens (mood boards, client portal, dashboard). Scroll-triggered animations.
Section 3: "Designed for designers" — emphasize the beauty of the platform itself. Show branded client portal, stunning proposals, elegant budgets.
Section 4: AI features — subtle framing. "Your invisible assistant." Show AI proposal, AI renders, AI chatbot.
Section 5: Pricing table — clean, elegant. Not a comparison matrix nightmare.
Section 6: Testimonials / "Built by a designer" (wife's endorsement + photo)
Section 7: FAQ (minimal, clean accordion)
Footer: CTA repeat, refined footer design

Design notes: Warm color palette, editorial typography, parallax scrolling, large imagery, generous whitespace. Should feel like a Squarespace template for a luxury brand.
```

---

## Development Setup

**Local folder:** `GitHub-Repos/IDStudio/` on Ryan's machine
**GitHub repo:** `RyanOrdonez/IDStudio` (to be created when ready for MVP push)
**Domain:** app.idstudio.ai via Hostinger DNS → Vercel
**Deployment:** Web app on Vercel + downloadable desktop app (Electron/Tauri)

---

## Next Steps

1. Open a new Claude Code session pointed at `GitHub-Repos/IDStudio/` folder
2. Paste the session prompt to give Claude full context
3. Have PRODUCT-PLAN.md in the folder root as the reference doc
4. Start building Week 1, Day 1
5. Wife beta tests continuously throughout the 4 weeks
6. Push to GitHub when we have a working MVP
