import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireOperator(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Sign in to continue.");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Operator access required.");
  return userId;
}

async function findOperatorId(ctx: QueryCtx | MutationCtx) {
  const operator = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("role"), "admin"))
    .first();
  return operator?._id ?? null;
}

export const isOperator = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return false;
    const user = await ctx.db.get(userId);
    return user?.role === "admin";
  },
});

/**
 * Bootstrap route for a fresh deployment: the first signed-in account can
 * become the operator. Once an operator exists, this refuses every later
 * caller, so the console cannot be claimed by a customer.
 */
export const claimOperator = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to claim operator access.");
    const user = await ctx.db.get(userId);
    if (user?.role === "admin") return true;
    if (user?.isAnonymous)
      throw new Error(
        "Create a full account before claiming operator access.",
      );

    const existing = await findOperatorId(ctx);
    if (existing) {
      throw new Error(
        "This deployment already has an operator. Ask them to grant you access.",
      );
    }

    await ctx.db.patch(userId, { role: "admin" });
    return true;
  },
});

export const deleteEnrollment = mutation({
  args: { id: v.id("seniors") },
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    await ctx.db.delete(args.id);
  },
});

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireOperator(ctx);

    const [plans, seniors, comments, members] = await Promise.all([
      ctx.db.query("plans").collect(),
      ctx.db.query("seniors").collect(),
      ctx.db.query("planComments").collect(),
      ctx.db.query("users").take(200),
    ]);

    const planNames = new Map(plans.map((plan) => [plan._id, plan.name]));
    const memberEmails = new Map(
      members.map((member) => [member._id, member.email ?? null]),
    );

    return {
      stats: {
        programs: plans.length,
        published: plans.filter((plan) => plan.status === "published").length,
        enrollments: seniors.length,
        comments: comments.length,
        members: members.length,
      },
      programs: plans
        .sort((a, b) => a.order - b.order)
        .map((plan) => ({
          _id: plan._id,
          name: plan.name,
          slug: plan.slug,
          tagline: plan.tagline,
          category: plan.category,
          summary: plan.summary,
          status: plan.status,
          price: plan.price,
          unit: plan.unit,
          languages: plan.languages,
          features: plan.features,
          specs: plan.specs,
          updatedAt: plan.updatedAt,
        })),
      enrollments: seniors
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((senior) => ({
          _id: senior._id,
          fullName: senior.fullName,
          age: senior.age,
          language: senior.language,
          phone: senior.phone,
          createdAt: senior.createdAt,
          guardianEmail: memberEmails.get(senior.guardianId) ?? null,
        })),
      comments: comments
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 25)
        .map((comment) => ({
          _id: comment._id,
          body: comment.body,
          authorName: comment.authorName,
          createdAt: comment.createdAt,
          planName: planNames.get(comment.planId) ?? "Removed program",
        })),
    };
  },
});
