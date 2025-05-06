import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/server/db";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId:
        "283356815990-sok2g49h8cfdb3hpn3e4kmge7rr1lkbc.apps.googleusercontent.com",
      clientSecret: "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",
    },
  },
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true, // Or false, depending on your needs
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            // IMPORTANT: Replace this with your ACTUAL price ID from your Stripe test environment
            // Go to Stripe Dashboard > Test Mode > Products > Pro Tier > Click on the $4.00/month price
            // Copy the Price ID (starts with price_)
            priceId: "price_1RLDArGpwwIGDewkBOBDickP",
            limits: { pdfUploads: 50 },
          },
        ],
      },
      onCustomerCreate: async ({ customer, user }) => {
        console.log(`Customer ${customer.id} created for user ${user.id}`);
      },
    }),
  ],
});
