# Stripe Setup Checklist

Things you (Ryan) need to do in the Stripe Dashboard and Vercel **outside of code** before the Stripe upgrade flow will work end-to-end. The code is shipped and the build is green — this file is the human checklist.

Last updated: 2026-04-07
Currently in: **Stripe test mode** (`sk_test_...` key)

---

## 1. Verify webhook endpoint is configured in Stripe

The webhook endpoint is what keeps the Supabase `subscriptions` table in sync with Stripe after a successful checkout. Without it, users will pay, land on `/checkout-success`, but the dashboard will still show their old plan.

### Steps

1. Go to https://dashboard.stripe.com/test/webhooks (make sure you're in **Test mode** — toggle at the top of the Stripe dashboard)
2. Look for an endpoint pointing at `https://idstudio-ai.vercel.app/api/webhooks`
3. **If it exists**, click into it and confirm these events are selected:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
4. **If it does not exist**, click **+ Add endpoint** and:
   - Endpoint URL: `https://idstudio-ai.vercel.app/api/webhooks`
   - Description: `IDStudio.Ai production webhook`
   - Events to send: the 6 listed above
   - Click **Add endpoint**

### Then verify the signing secret matches Vercel

5. On the webhook endpoint detail page, click **Reveal** next to "Signing secret". Copy the value (starts with `whsec_...`)
6. Go to https://vercel.com/ryanordonez7-3016s-projects/idstudio-ai/settings/environment-variables
7. Find `STRIPE_WEBHOOK_SECRET`. Compare to what you just copied from Stripe.
8. **If they match**: done, nothing to do.
9. **If they do NOT match**:
   - Click the pencil/edit icon next to `STRIPE_WEBHOOK_SECRET`
   - Paste the new value from Stripe
   - Make sure all three targets (Production, Preview, Development) are checked
   - Save
   - **Trigger a redeploy** — either push any commit, or in Vercel go to Deployments → latest → ... menu → Redeploy. Env var changes only take effect on new deploys.

---

## 2. End-to-end test (once the above is done)

Run this to confirm the full flow actually works in production.

1. Open https://idstudio-ai.vercel.app/signup in an **incognito window**
2. Sign up with a fresh email (e.g., `test-YYYYMMDD@example.com`)
3. Verify your email if Supabase requires it, log in
4. Should land on `/dashboard` — middleware auto-creates a trial subscription
5. Visit `/pricing`
6. Click **Upgrade to Professional** on the Pro card ($79/mo)
7. On Stripe Checkout, pay with the test card:
   - **Number:** `4242 4242 4242 4242`
   - **Expiry:** any future date (e.g., `12/30`)
   - **CVC:** any 3 digits (e.g., `123`)
   - **ZIP:** any (e.g., `10001`)
   - Name/email can be anything
8. Should redirect to `/checkout-success` with the success animation
9. Click **Go to dashboard**
10. Go to **Settings → Billing** tab
11. Verify:
    - Header says "Professional" with **Active** badge
    - Credit bar shows `0 / 200 credits`
    - **Manage billing** button is visible
    - Pro card in the upgrade grid says "Current plan" (disabled)
    - Starter card says "Switch to Starter"
12. Click **Manage billing** → should open Stripe billing portal in the same window
13. Click back arrow / return link → should return to `/dashboard/settings`

### If step 11 fails (still shows old plan)

- Wait 30 seconds and refresh. Webhooks are async; the polling on `/checkout-success` gives it 5 seconds of grace, but if the webhook is misconfigured it'll never arrive.
- Check Stripe Dashboard → Developers → Webhooks → your endpoint → recent events. Look for `customer.subscription.created` — did it fire? Did it return 200? If it returned 400/500, click the event and read the error.
- Check Vercel → Deployments → Functions → `/api/webhooks` logs for the most recent request.

### Common failure modes

| Symptom | Likely cause |
|---|---|
| Checkout redirects to `/checkout-success` but plan never updates | Webhook not configured, or `STRIPE_WEBHOOK_SECRET` mismatch between Stripe and Vercel |
| `POST /api/checkout` returns 500 | `STRIPE_SECRET_KEY` missing or invalid in Vercel |
| Stripe Checkout page itself doesn't load | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` missing in Vercel |
| Checkout returns "Invalid price ID" 400 | `STRIPE_STARTER_PLAN_PRICE_ID` or `STRIPE_PRO_PLAN_PRICE_ID` in Vercel doesn't match a real price in Stripe |
| Webhook endpoint hits 401 | `SUPABASE_SERVICE_ROLE_KEY` missing in Vercel (the webhook writes to Supabase bypassing RLS) |

---

## 3. Local development with Stripe webhooks

If you want to run the full flow locally (not required for production testing):

1. Install the Stripe CLI: https://docs.stripe.com/stripe-cli
2. In one terminal: `stripe listen --forward-to localhost:3000/api/webhooks`
3. Copy the printed `whsec_...` value into `.env.local` as `STRIPE_WEBHOOK_SECRET`
4. Restart `npm run dev`
5. The local test flow is the same as above, but starting from `http://localhost:3000/signup`. Stripe CLI will forward webhook events to your local dev server.

Note: your local `STRIPE_WEBHOOK_SECRET` from `stripe listen` is **different** from the production `STRIPE_WEBHOOK_SECRET` in Vercel. They don't conflict — each is scoped to its respective endpoint.

---

## 4. Going live (do NOT do this yet — still test mode)

When you're ready to accept real money from real customers:

1. Complete Stripe account activation in the Stripe Dashboard (bank account, business info, tax ID, etc.)
2. Toggle Stripe Dashboard from **Test mode** to **Live mode** (top of dashboard)
3. Re-create the Starter and Pro **products and prices** in live mode at the same dollar amounts ($29/mo and $79/mo). Test-mode prices do NOT work in live mode — they are entirely separate.
4. Re-create the **webhook endpoint** in live mode (same URL, same events)
5. In Vercel, replace these env vars with their live-mode equivalents (note: keep the test values backed up somewhere in case you need to roll back):
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_STARTER_PLAN_PRICE_ID` → new live price ID
   - `STRIPE_PRO_PLAN_PRICE_ID` → new live price ID
   - `NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID` → same as STARTER above
   - `NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID` → same as PRO above
   - `STRIPE_WEBHOOK_SECRET` → signing secret from the live webhook endpoint
6. Redeploy Vercel
7. Run the end-to-end test from section 2 using a **real credit card** (yours) with a dollar amount you're willing to pay. Test it by upgrading then immediately canceling via the billing portal to refund yourself.

This is a Phase 6 (pre-launch) task per `BUILD-PLAN.md`. Don't do it until closer to launch.

---

## Current Stripe state (as of 2026-04-07)

Verified via API read:
- **Mode:** Test (`sk_test_...`)
- **Starter price:** `price_1S1T7iGrBbjoKeAz01TsPsEb` → $29.00 USD / month, active
- **Pro price:** `price_1S1odRGrBbjoKeAz5pcLafny` → $79.00 USD / month, active

These match `lib/stripe.ts` `PRICING_PLANS.starter.price = 29` and `pro.price = 79`. If you ever change the prices in Stripe, update `lib/stripe.ts` to match so the UI stays honest.
