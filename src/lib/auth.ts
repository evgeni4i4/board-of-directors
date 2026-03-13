import { auth } from "@clerk/nextjs/server";

const hasClerkKeys = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

/**
 * Safe auth helper that works with or without Clerk keys.
 * When Clerk is not configured, returns a fallback anonymous user.
 */
export async function getAuth(): Promise<{ userId: string | null }> {
  if (!hasClerkKeys) {
    // No Clerk keys — use anonymous fallback so the app still works
    return { userId: "anon" };
  }

  try {
    const { userId } = await auth();
    return { userId };
  } catch (error) {
    console.error("Auth error:", error);
    return { userId: null };
  }
}
