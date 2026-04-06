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

export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Up to 3 projects',
      'Basic AI Assistant',
      'Community Support',
      '1GB File Storage'
    ],
    limits: {
      projects: 3,
      files: 10,
      conversations: 3,
      messages: 50
    }
  },
  starter: {
    name: 'Starter',
    price: 29,
    get priceId() {
      return process.env.STRIPE_STARTER_PLAN_PRICE_ID!;
    },
    features: [
      'Up to 10 active projects',
      'AI Assistant & Mood Boards',
      'Client Management',
      '5GB File Storage',
      'Email Support'
    ],
    limits: {
      projects: 10,
      files: 100,
      conversations: 20,
      messages: 1000
    }
  },
  pro: {
    name: 'Professional',
    price: 79,
    get priceId() {
      return process.env.STRIPE_PRO_PLAN_PRICE_ID!;
    },
    popular: true,
    features: [
      'Unlimited projects',
      'Advanced AI Features',
      'Document Generation',
      '50GB File Storage',
      'Priority Support'
    ],
    limits: {
      projects: -1, // unlimited
      files: -1,
      conversations: -1,
      messages: -1
    }
  }
};

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
  trialPeriodDays = STRIPE_CONFIG.TRIAL_PERIOD_DAYS,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
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
    subscription_data: {
      trial_period_days: trialPeriodDays,
    },
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
