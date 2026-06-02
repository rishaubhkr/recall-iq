"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Returns the current Convex user document matched by Clerk ID.
 * Also ensures the user record exists (creates it via mutation if not).
 *
 * Usage:
 *   const { convexUser, isLoading } = useConvexUser();
 */
export function useConvexUser() {
  const { user, isLoaded } = useUser();
  const clerkId = user?.id ?? "";

  // Query the Convex user record
  const convexUser = useQuery(
    api.users.getByClerkId,
    isLoaded && clerkId ? { clerkId } : "skip",
  );

  // Ensure user is created in Convex if they exist in Clerk but not Convex
  const getOrCreate = useMutation(api.users.getOrCreate);

  // If Clerk is loaded, user is signed in, but Convex record doesn't exist yet → create it
  if (
    isLoaded &&
    user &&
    convexUser === null // null = query ran but record missing
  ) {
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    const displayName =
      user.fullName ?? user.firstName ?? email.split("@")[0];
    getOrCreate({ clerkId, email, displayName });
  }

  return {
    convexUser: convexUser ?? null,
    convexUserId: convexUser?._id as Id<"users"> | undefined,
    tier: convexUser?.tier ?? "free",
    streak: convexUser?.streak ?? 0,
    totalReviews: convexUser?.totalReviews ?? 0,
    isLoading: !isLoaded || convexUser === undefined,
  };
}
