import React from "react";
import { ClerkProvider as BaseClerkProvider } from "@clerk/clerk-react";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const ENABLE_OFFLINE_MODE = import.meta.env.VITE_ENABLE_OFFLINE_ACCOUNTS === 'true';

if (!CLERK_PUBLISHABLE_KEY && !ENABLE_OFFLINE_MODE) {
  console.warn(
    "Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to your .env file, " +
    "or set VITE_ENABLE_OFFLINE_ACCOUNTS=true for local development."
  );
}

export default function ClerkProvider({ children }) {
  // Use Clerk if available
  if (CLERK_PUBLISHABLE_KEY) {
    return (
      <BaseClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        {children}
      </BaseClerkProvider>
    );
  }

  // Fallback: render without Clerk (offline mode or missing config)
  // The app will handle authentication state via localStorage
  return <>{children}</>;
}
