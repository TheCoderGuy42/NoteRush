import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    stripeClient({
      subscription: true, // Enable subscription management features
    }),
  ],
});
export const { signIn, signUp, useSession, signOut } = createAuthClient();
