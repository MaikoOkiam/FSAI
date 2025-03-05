
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const CREDIT_PRICES = {
  '100': 500,  // 100 credits for €5.00
  '500': 1000  // 500 credits for €10.00
};

export type CreditPackage = keyof typeof CREDIT_PRICES;

export function isCreditPackage(value: string): value is CreditPackage {
  return value in CREDIT_PRICES;
}
