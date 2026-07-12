import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { DataModel } from "./_generated/dataModel";

export async function getAuthenticatedUser(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated: Please log in first.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User record not found in database.");
  }

  return user;
}

export async function validateUserOwnership(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  targetUserId: string
) {
  const user = await getAuthenticatedUser(ctx);
  if (user._id !== targetUserId) {
    throw new Error("Unauthorized: Cannot access data belonging to another user.");
  }
  return user;
}

export async function validateAdmin(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>
) {
  const user = await getAuthenticatedUser(ctx);
  if (user.tier !== "admin") {
    throw new Error("Unauthorized: Admin privilege required.");
  }
  return user;
}
