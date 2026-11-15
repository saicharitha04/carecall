import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const planStatus = v.union(
  v.literal("published"),
  v.literal("draft"),
  v.literal("archived"),
);

const planInput = {
  name: v.string(),
  tagline: v.string(),
  category: v.string(),
  summary: v.string(),
  price: v.number(),
  unit: v.string(),
  languages: v.array(v.string()),
  features: v.array(v.string()),
  specs: v.array(v.object({ label: v.string(), value: v.string() })),
  status: planStatus,
};

async function requireOperator(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Sign in to continue.");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Admin access required.");
  return userId;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const STARTER_CATALOG = [
  {
    slug: "daily-voice-care",
    name: "Daily Voice Care",
    tagline:
      "Scheduled medicine calls in the language your parent thinks in.",
    category: "Medication",
    summary:
      "A two-way AI call at every dose time. The agent names the tablet, describes its colour and shape, says exactly where it is kept, and stays on the line for questions about food, side effects or pain. Confirmation is captured by voice or keypad, and every outcome is written to the family workspace.",
    price: 0,
    unit: "Free for every family",
    languages: ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam", "English"],
    features: [
      "Outbound AI calls at each prescribed dose time",
      "Natural two-way conversation in the senior's mother tongue",
      "Pill identified by colour, shape and physical location",
      "Voice or keypad confirmation, logged dose by dose",
      "Dietary guardrails derived from the medical profile",
    ],
    specs: [
      { label: "Call window", value: "±10 minutes of dose" },
      { label: "Retry cadence", value: "10 minutes, then escalation" },
      { label: "Confirmation", value: "Voice or keypad" },
      { label: "Call records", value: "Audio and transcript, 90 days" },
      { label: "Delivery", value: "PSTN, mobile, landline" },
    ],
    order: 1,
  },
  {
    slug: "watch-vitals-sync",
    name: "Watch Vitals Sync",
    tagline:
      "Heart rate, blood oxygen and sleep from the watch already on their wrist.",
    category: "Monitoring",
    summary:
      "CareCall reads the measurements a budget smartwatch already takes and turns them into a quiet baseline. Nothing to open, pair or configure on the senior's phone. Anomalies are compared against that individual baseline, not a population average, before anything is escalated.",
    price: 0,
    unit: "Free for every family",
    languages: ["Language independent"],
    features: [
      "Passive sync through Google Health Connect and Apple HealthKit",
      "Heart rate, SpO₂ and sleep cycles in one timeline",
      "Per-senior anomaly thresholds, not generic ranges",
      "Weekly trend summary for every guardian",
      "No app, login or settings on the senior's device",
    ],
    specs: [
      { label: "Devices", value: "Noise, Fire-Boltt, Amazfit" },
      { label: "Sync interval", value: "Every 10 minutes" },
      { label: "Metrics", value: "Heart rate, SpO₂, sleep" },
      { label: "Alerting", value: "Baseline-relative" },
      { label: "Retention", value: "24 months" },
    ],
    order: 2,
  },
  {
    slug: "escalation-network",
    name: "Escalation Network",
    tagline: "Three stages, in a fixed order, with no silent failures.",
    category: "Emergency",
    summary:
      "A missed dose or a critical reading never ends at a notification. Stage one retries the senior. Stage two reaches the primary guardian by WhatsApp and SMS. Stage three routes to a named neighbour, then to the nearest ambulance desk with the home address and the latest vitals.",
    price: 0,
    unit: "Free for every family",
    languages: ["English", "Hindi", "Telugu", "Tamil", "Kannada"],
    features: [
      "Stage 1 retry and non-adherence logging",
      "Stage 2 guardian alert within sixty seconds",
      "Stage 3 Tier A neighbour or relative",
      "Stage 3 Tier B ambulance desk routing",
      "Immutable incident timeline for every event",
    ],
    specs: [
      { label: "Stage 1", value: "Retry, then adherence log" },
      { label: "Stage 2", value: "Guardian alert ≤ 60 seconds" },
      { label: "Stage 3", value: "Tier A contact, Tier B ambulance" },
      { label: "Channels", value: "Voice, SMS, WhatsApp" },
      { label: "Audit", value: "Append-only incident trail" },
    ],
    order: 3,
  },
  {
    slug: "family-workspace",
    name: "Family Workspace",
    tagline: "One care plan, one page, every guardian who shares it.",
    category: "Platform",
    summary:
      "The guardian side of CareCall. Enrol a parent in minutes, upload the prescription, and keep the medical record, emergency hierarchy and care history together. Several family members can hold access without forwarding screenshots to each other.",
    price: 0,
    unit: "Free for every family",
    languages: ["English", "Hindi"],
    features: [
      "Multi-step senior enrolment with prescription parsing",
      "Medical records, conditions and uploaded documents",
      "Guardian, neighbour and hospital hierarchy",
      "Invite-only access for additional family members",
      "Export the full record as PDF or JSON",
    ],
    specs: [
      { label: "Roles", value: "Owner, guardian, viewer" },
      { label: "Access", value: "Invite-only" },
      { label: "Storage", value: "Encrypted at rest" },
      { label: "Export", value: "PDF and JSON" },
    ],
    order: 4,
  },
  {
    slug: "regional-voice-pack",
    name: "Regional Voice Pack",
    tagline: "Ten languages, reviewed with native speakers and tuned per family.",
    category: "Voice",
    summary:
      "The same call, spoken the way your parent actually speaks. Each language pack is reviewed by native speakers, keeps a per-family glossary for medicine names, and can be adjusted for dialect and pace without changing the underlying program.",
    price: 0,
    unit: "Free for every family",
    languages: [
      "Telugu",
      "Hindi",
      "Tamil",
      "Kannada",
      "Malayalam",
      "Marathi",
      "Bengali",
      "Gujarati",
      "Punjabi",
      "Odia",
    ],
    features: [
      "Native-reviewed scripts for every language",
      "Per-family glossary for medicine and device names",
      "Adjustable speaking pace and repetition",
      "Escalation phrases recorded in the same language",
    ],
    specs: [
      { label: "Languages", value: "10, with more on request" },
      { label: "Review", value: "Native speaker sign-off" },
      { label: "Glossary", value: "Per family" },
      { label: "Pace", value: "Adjustable per senior" },
    ],
    order: 5,
  },
];

const FREE_UNIT = "Free for every family";

export const seedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("plans").collect();
    if (existing.length > 0) {
      // Normalise a previously seeded catalog: every care program is free, and
      // the old commercial console listing is retired.
      let updated = 0;
      const brand = (value: string) =>
        value.replace(/Saathi|Carecall/g, "CareCall");
      for (const plan of existing) {
        if (plan.slug === "operator-console") {
          const comments = await ctx.db
            .query("planComments")
            .withIndex("by_plan", (q) => q.eq("planId", plan._id))
            .collect();
          for (const comment of comments) await ctx.db.delete(comment._id);
          await ctx.db.delete(plan._id);
          updated += 1;
          continue;
        }
        const brandFix = [
          plan.name,
          plan.tagline,
          plan.summary,
          ...plan.features,
          ...plan.specs.flatMap((spec) => [spec.label, spec.value]),
        ].some((value) => /Saathi|Carecall/.test(value));
        if (plan.price !== 0 || plan.unit !== FREE_UNIT || brandFix) {
          await ctx.db.patch(plan._id, {
            name: brand(plan.name),
            tagline: brand(plan.tagline),
            summary: brand(plan.summary),
            features: plan.features.map(brand),
            specs: plan.specs.map((spec) => ({
              label: brand(spec.label),
              value: brand(spec.value),
            })),
            price: 0,
            unit: FREE_UNIT,
            updatedAt: Date.now(),
          });
          updated += 1;
        }
      }
      return { seeded: 0, updated };
    }
    const now = Date.now();
    for (const plan of STARTER_CATALOG) {
      await ctx.db.insert("plans", {
        ...plan,
        price: 0,
        unit: FREE_UNIT,
        status: "published",
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: STARTER_CATALOG.length };
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    return plans.sort((a, b) => a.order - b.order);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireOperator(ctx);
    const plans = await ctx.db.query("plans").collect();
    return plans.sort((a, b) => a.order - b.order);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!plan || plan.status !== "published") return null;
    return plan;
  },
});

export const upsertPlan = mutation({
  args: {
    id: v.optional(v.id("plans")),
    ...planInput,
  },
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    if (!args.name.trim()) throw new Error("A program needs a name.");
    if (!args.tagline.trim()) throw new Error("A program needs a tagline.");
    if (!args.summary.trim()) throw new Error("A program needs a summary.");

    let slug = slugify(args.name);
    if (!slug) throw new Error("Use at least one letter or number in the name.");

    const clash = await ctx.db
      .query("plans")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (clash && clash._id !== args.id) {
      let suffix = 2;
      while (
        await ctx.db
          .query("plans")
          .withIndex("by_slug", (q) => q.eq("slug", `${slug}-${suffix}`))
          .first()
      ) {
        suffix += 1;
      }
      slug = `${slug}-${suffix}`;
    }

    // Every program is free. Pricing is not a configurable field in CareCall,
    // so these values are fixed here rather than trusted from the client.
    const payload = {
      name: args.name.trim(),
      tagline: args.tagline.trim(),
      category: args.category.trim() || "Care",
      summary: args.summary.trim(),
      price: 0,
      unit: FREE_UNIT,
      languages: args.languages.filter(Boolean),
      features: args.features.filter(Boolean),
      specs: args.specs.filter((spec) => spec.label.trim() && spec.value.trim()),
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.id) {
      await ctx.db.patch(args.id, { ...payload, slug });
      return args.id;
    }

    const all = await ctx.db.query("plans").collect();
    const nextOrder = all.reduce((max, plan) => Math.max(max, plan.order), 0) + 1;
    return await ctx.db.insert("plans", {
      ...payload,
      slug,
      order: nextOrder,
      createdAt: Date.now(),
    });
  },
});

export const setPlanStatus = mutation({
  args: { id: v.id("plans"), status: planStatus },
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const deletePlan = mutation({
  args: { id: v.id("plans") },
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    const comments = await ctx.db
      .query("planComments")
      .withIndex("by_plan", (q) => q.eq("planId", args.id))
      .collect();
    for (const comment of comments) await ctx.db.delete(comment._id);
    await ctx.db.delete(args.id);
  },
});

export const listComments = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("planComments")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    return comments.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const addComment = mutation({
  args: {
    planId: v.id("plans"),
    authorName: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to join the conversation.");
    const name = args.authorName.trim();
    const body = args.body.trim();
    if (name.length < 2) throw new Error("Add a name with at least 2 characters.");
    if (name.length > 60) throw new Error("Keep the name under 60 characters.");
    if (body.length < 3) throw new Error("Write a little more before posting.");
    if (body.length > 800) throw new Error("Keep the comment under 800 characters.");
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("That program no longer exists.");
    return await ctx.db.insert("planComments", {
      planId: args.planId,
      authorId: userId,
      authorName: name,
      body,
      createdAt: Date.now(),
    });
  },
});

export const deleteComment = mutation({
  args: { id: v.id("planComments") },
  handler: async (ctx, args) => {
    await requireOperator(ctx);
    await ctx.db.delete(args.id);
  },
});
