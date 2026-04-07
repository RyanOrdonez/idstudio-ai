import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }
  return stripeInstance;
};

export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    return getStripe()[prop as keyof Stripe];
  }
});

export const STRIPE_CONFIG = {
  get STARTER_PLAN_PRICE_ID() {
    return process.env.STRIPE_STARTER_PLAN_PRICE_ID!;
  },
  get PRO_PLAN_PRICE_ID() {
    return process.env.STRIPE_PRO_PLAN_PRICE_ID!;
  },
  get WEBHOOK_SECRET() {
    return process.env.STRIPE_WEBHOOK_SECRET!;
  },
  TRIAL_PERIOD_DAYS: 14,
};

// Single source of truth for plan metadata shown in the UI.
// Prices here MUST match the amounts configured in the Stripe Dashboard
// for STRIPE_STARTER_PLAN_PRICE_ID and STRIPE_PRO_PLAN_PRICE_ID.
// If you change prices in Stripe, update these values to match.
export const PRICING_PLANS = {
  free: {
    name: 'Free',
    tagline: 'Explore IDStudio at your own pace',
    price: 0,
    priceId: null,
    features: [
      '7 AI credits per week',
      '1 active project',
      'Basic mood boards',
      '1 GB file storage',
      'Community support',
    ],
    limits: {
      projects: 1,
      files: 10,
      conversations: 3,
      messages: 50,
    },
  },
  starter: {
    name: 'Starter',
    tagline: 'For solo designers getting started',
    price: 29,
    get priceId() {
      return process.env.STRIPE_STARTER_PLAN_PRICE_ID!;
    },
    features: [
      '50 AI credits per week',
      '10 active projects',
      'Mood boards & document generation',
      '5 GB file storage',
      'Email support',
    ],
    limits: {
      projects: 10,
      files: 100,
      conversations: 20,
      messages: 1000,
    },
  },
  pro: {
    name: 'Professional',
    tagline: 'For established solo designers',
    price: 79,
    get priceId() {
      return process.env.STRIPE_PRO_PLAN_PRICE_ID!;
    },
    popular: true,
    features: [
      '200 AI credits per week',
      'Unlimited projects',
      'All AI features & document generation',
      '50 GB file storage',
      'Priority support',
    ],
    limits: {
      projects: -1, // unlimited
      files: -1,
      conversations: -1,
      messages: -1,
    },
  },
};

/**
 * Maps a Stripe price ID back to our internal plan_type identifier.
 * Returns null for unknown price IDs (e.g. legacy or test prices we don't recognize).
 * Used by the webhook handler to keep the database plan_type column in sync
 * when subscriptions are created or updated.
 */
export function priceIdToPlanType(priceId: string): 'starter' | 'pro' | null {
  if (priceId === STRIPE_CONFIG.STARTER_PLAN_PRICE_ID) return 'starter';
  if (priceId === STRIPE_CONFIG.PRO_PLAN_PRICE_ID) return 'pro';
  return null;
}

export const getStripeCustomerByEmail = async (email: string) => {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });
  return customers.data[0] || null;
};

export const createStripeCustomer = async (email: string, name?: string) => {
  return await stripe.customers.create({
    email,
    name,
  });
};

export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  trialPeriodDays,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  /**
   * Trial period in days. Pass `null` or omit for no trial (the default).
   * The upgrade flow never offers a trial because auto-trial already ran on signup.
   * Pass an explicit positive number only if starting a brand-new trial.
   */
  trialPeriodDays?: number | null;
}) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data:
      trialPeriodDays && trialPeriodDays > 0
        ? { trial_period_days: trialPeriodDays }
        : undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });
};

export const createBillingPortalSession = async (customerId: string, returnUrl: string) => {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
};

/**
 * Create a one-time payment Checkout Session for an invoice.
 * Used by /api/invoices/[id]/payment-link.
 *
 * The session expires after Stripe's default ~24h window. We always create
 * a fresh session when the user clicks "Get payment link", so stale links
 * aren't a concern in practice — the invoice's stored session_id is replaced
 * each time.
 *
 * Uses a single aggregated line item ("Invoice {number}") rather than multiple
 * stripe line items so the customer-facing receipt is clean. The detailed
 * breakdown lives on the PDF.
 */
export const createOneTimeCheckoutSession = async ({
  customerId,
  invoiceId,
  amount,
  currency = 'usd',
  invoiceNumber,
  description,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  invoiceId: string
  amount: number // dollars (we convert to cents below)
  currency?: string
  invoiceNumber: string
  description?: string
  successUrl: string
  cancelUrl: string
}) => {
  return await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Invoice ${invoiceNumber}`,
            description: description || undefined,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
    },
    payment_intent_data: {
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
};
