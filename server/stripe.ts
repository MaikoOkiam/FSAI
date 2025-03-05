
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const CREDIT_PRICES = {
  '50': 500,   // 50 credits for €5.00
  '100': 900,  // 100 credits for €9.00
  '250': 2000, // 250 credits for €20.00
  '500': 3500  // 500 credits for €35.00
};

export type CreditPackage = keyof typeof CREDIT_PRICES;

export function isCreditPackage(value: string): value is CreditPackage {
  return value in CREDIT_PRICES;
}
