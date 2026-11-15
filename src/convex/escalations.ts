/**
 * Escalation orchestration.
 *
 * Actions own the external I/O (provider calls); internal mutations own the
 * append-only audit trail. The decision tree itself lives in
 * `lib/escalation.ts` so it stays testable and easy to audit.
 *
 * Timeline:
 *   0 min  Stage 1 voice retry to the senior
 *  10 min  Stage 2 WhatsApp + SMS to the primary guardian
 *  25 min  Stage 3 Tier A local contact, Tier B ambulance desk
 *
 * A guardian can acknowledge at any point, which stops the ladder. The
 * scheduler advances anything still open, so silence itself is a trigger.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import {
  assessVitals,
  initialStage,
  nextStage,
  normalizePhoneNumber,
  planStage,
  type EmergencyTargets,
  type EscalationKind,
  type EscalationStage,
} from "./lib/escalation";
import { dispatchDelivery } from "./lib/notify";

const kindValidator = v.union(v.literal("missed_dose"), v.literal("vitals"));
const stageValidator = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
);

const deliveryStatusValidator = v.union(
  v.literal("sent"),
  v.literal("simulated"),
  v.literal("failed"),
);

const deliveryValidator = v.object({
  stage: v.number(),
  channel: v.string(),
  target: v.string(),
  status: deliveryStatusValidator,
  provider: v.string(),
  reference: v.optional(v.string()),
  error: v.optional(v.string()),
  summary: v.string(),
  at: v.number(),
});

type DeliverySummary = {
  channel: string;
  target: string;
  status: "sent" | "simulated" | "failed";
};

type StartResult = {
  started: boolean;
  stage: EscalationStage | null;
  escalationId?: Id<"escalations">;
  reason?: string;
  warnings: string[];
  deliveries: DeliverySummary[];
};

type AdvanceResult = {
  advanced: boolean;
  stage?: EscalationStage;
  reason?: string;
  warnings: string[];
  deliveries: DeliverySummary[];
};

const targetsValidator = v.object({
  seniorName: v.string(),
  seniorPhone: v.string(),
  guardianName: v.string(),
  guardianPhone: v.string(),
  localName: v.string(),
  localPhone: v.string(),
  hospital: v.string(),
  ambulancePhone: v.string(),
  address: v.string(),
});

function asStage(value: number): EscalationStage {
  if (value === 1 || value === 2 || value === 3) return value;
  return 1;
}

function targetsFor(senior: {
  fullName: string;
  phone: string;
  emergency: {
    primaryName: string;
    primaryPhone: string;
    secondaryName: string;
    secondaryPhone: string;
    hospital: string;
    ambulance: string;
    address: string;
  };
}): EmergencyTargets {
  return {
    seniorName: senior.fullName,
    seniorPhone: normalizePhoneNumber(senior.phone) ?? senior.phone,
    guardianName: senior.emergency.primaryName,
    guardianPhone:
      normalizePhoneNumber(senior.emergency.primaryPhone) ??
      senior.emergency.primaryPhone,
    localName: senior.emergency.secondaryName,
    localPhone:
      normalizePhoneNumber(senior.emergency.secondaryPhone) ??
      senior.emergency.secondaryPhone,
    hospital: senior.emergency.hospital,
    ambulancePhone: senior.emergency.ambulance || "108",
    address: senior.emergency.address,
  };
}

async function deliverAll(
  deliveries: {
    stage: EscalationStage;
    channel: "voice" | "whatsapp" | "sms" | "ambulance";
    target: string;
    summary: string;
  }[],
) {
  // Parallel dispatch: one channel being down must not delay the others.
  return await Promise.all(
    deliveries.map(async (delivery) => {
      const outcome = await dispatchDelivery({
        channel: delivery.channel,
        target: delivery.target,
        summary: delivery.summary,
      });
      return {
        stage: delivery.stage,
        channel: delivery.channel,
        target: delivery.target,
        summary: delivery.summary,
        status: outcome.status,
        provider: outcome.provider,
        reference: outcome.reference,
        error: outcome.error,
        at: Date.now(),
      };
    }),
  );
}

export const getSeniorForEscalation = internalQuery({
  args: { seniorId: v.id("seniors"), guardianId: v.id("users") },
  handler: async (ctx, args) => {
    const senior = await ctx.db.get(args.seniorId);
    if (!senior || senior.guardianId !== args.guardianId) return null;
    return senior;
  },
});

export const getIncident = internalQuery({
  args: { id: v.id("escalations") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const recordIncident = internalMutation({
  args: {
    seniorId: v.id("seniors"),
    guardianId: v.id("users"),
    kind: kindValidator,
    stage: stageValidator,
    trigger: v.string(),
    targets: targetsValidator,
    deliveries: v.array(deliveryValidator),
    nextStageAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("escalations", {
      seniorId: args.seniorId,
      guardianId: args.guardianId,
      kind: args.kind,
      stage: args.stage,
      status: "open",
      trigger: args.trigger,
      targets: args.targets,
      deliveries: args.deliveries,
      nextStageAt: args.nextStageAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const applyAdvance = internalMutation({
  args: {
    id: v.id("escalations"),
    stage: stageValidator,
    deliveries: v.array(deliveryValidator),
    nextStageAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) throw new Error("Escalation no longer exists.");
    if (incident.status !== "open") return;

    await ctx.db.patch(args.id, {
      stage: args.stage,
      deliveries: [...incident.deliveries, ...args.deliveries],
      nextStageAt: args.nextStageAt,
      updatedAt: Date.now(),
    });
  },
});

export const dueEscalations = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const open = await ctx.db
      .query("escalations")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(50);
    return open
      .filter(
        (incident) =>
          incident.nextStageAt !== undefined && incident.nextStageAt <= now,
      )
      .slice(0, 20)
      .map((incident) => incident._id);
  },
});

export const listRecent = query({
  args: { seniorId: v.id("seniors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const senior = await ctx.db.get(args.seniorId);
    // Never reveal incidents from someone else's care plan.
    if (!senior || senior.guardianId !== userId) return [];
    return await ctx.db
      .query("escalations")
      .withIndex("by_senior", (q) => q.eq("seniorId", args.seniorId))
      .order("desc")
      .take(5);
  },
});

/**
 * Start an incident. A missed dose begins at stage 1; critical vitals skip
 * straight to the guardian because the retry window would waste time.
 */
export const start = action({
  args: { seniorId: v.id("seniors"), kind: kindValidator },
  handler: async (ctx, args): Promise<StartResult> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to start an escalation.");

    const senior = await ctx.runQuery(
      internal.escalations.getSeniorForEscalation,
      { seniorId: args.seniorId, guardianId: userId },
    );
    if (!senior)
      throw new Error("You do not have access to this care plan.");

    const latest = senior.vitals[senior.vitals.length - 1];
    const assessment = latest
      ? assessVitals({ at: latest.at, hr: latest.hr, spo2: latest.spo2 })
      : { critical: false, reasons: [] as string[] };

    if (args.kind === "vitals" && !assessment.critical)
      return {
        started: false,
        stage: null,
        reason: "The latest vitals are within the safe range.",
        warnings: [],
        deliveries: [],
      };

    const stage = initialStage(args.kind, assessment);
    const targets = targetsFor(senior);
    const trigger =
      args.kind === "vitals"
        ? assessment.reasons.join("; ") || "Critical vital reading"
        : "Missed medication dose without confirmation";

    const plan = planStage({
      stage,
      kind: args.kind as EscalationKind,
      targets,
      now: Date.now(),
    });
    const deliveries = await deliverAll(plan.deliveries);

    const escalationId = await ctx.runMutation(
      internal.escalations.recordIncident,
      {
        seniorId: args.seniorId,
        guardianId: userId,
        kind: args.kind,
        stage,
        trigger,
        targets,
        deliveries,
        nextStageAt: plan.nextStageAt,
      },
    );

    return {
      started: true,
      stage,
      escalationId,
      warnings: plan.warnings,
      deliveries: deliveries.map((delivery) => ({
        channel: delivery.channel,
        target: delivery.target,
        status: delivery.status,
      })),
    };
  },
});

/** Move one incident to its next stage immediately (used by drills and cron). */
export const advance = action({
  args: { escalationId: v.id("escalations") },
  handler: async (ctx, args): Promise<AdvanceResult> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to advance an escalation.");

    const incident = await ctx.runQuery(internal.escalations.getIncident, {
      id: args.escalationId,
    });
    if (!incident) throw new Error("Escalation no longer exists.");
    if (incident.guardianId !== userId)
      throw new Error("You do not have access to this escalation.");
    if (incident.status !== "open")
      return { advanced: false, reason: "This incident is closed.", warnings: [], deliveries: [] };

    const stage = nextStage(asStage(incident.stage));
    if (!stage)
      return {
        advanced: false,
        reason: "Stage 3 is the final rung of the safety net.",
        warnings: [],
        deliveries: [],
      };

    const plan = planStage({
      stage,
      kind: incident.kind as EscalationKind,
      targets: incident.targets,
      now: Date.now(),
    });
    const deliveries = await deliverAll(plan.deliveries);

    await ctx.runMutation(internal.escalations.applyAdvance, {
      id: args.escalationId,
      stage,
      deliveries,
      nextStageAt: plan.nextStageAt,
    });

    return {
      advanced: true,
      stage,
      warnings: plan.warnings,
      deliveries: deliveries.map((delivery) => ({
        channel: delivery.channel,
        target: delivery.target,
        status: delivery.status,
      })),
    };
  },
});

export const acknowledge = mutation({
  args: { id: v.id("escalations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to acknowledge an alert.");
    const incident = await ctx.db.get(args.id);
    if (!incident) throw new Error("Escalation no longer exists.");
    if (incident.guardianId !== userId)
      throw new Error("You do not have access to this escalation.");
    if (incident.status !== "open") return;

    await ctx.db.patch(args.id, {
      status: "acknowledged",
      nextStageAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const resolve = mutation({
  args: { id: v.id("escalations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to resolve an alert.");
    const incident = await ctx.db.get(args.id);
    if (!incident) throw new Error("Escalation no longer exists.");
    if (incident.guardianId !== userId)
      throw new Error("You do not have access to this escalation.");

    await ctx.db.patch(args.id, {
      status: "resolved",
      nextStageAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Background sweep. Convex cron invokes this every two minutes; anything that
 * has passed its grace window is advanced, which is what makes the "silence is
 * a trigger" guarantee real rather than aspirational.
 */
export const processDue = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ checked: number; advanced: number; failed: number }> => {
    const ids = await ctx.runQuery(internal.escalations.dueEscalations, {});
    let advanced = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const incident = await ctx.runQuery(
          internal.escalations.getIncident,
          { id },
        );
        if (!incident || incident.status !== "open") continue;

        const stage = nextStage(asStage(incident.stage));
        if (!stage) continue;

        const plan = planStage({
          stage,
          kind: incident.kind as EscalationKind,
          targets: incident.targets,
          now: Date.now(),
        });
        const deliveries = await deliverAll(plan.deliveries);

        await ctx.runMutation(internal.escalations.applyAdvance, {
          id,
          stage,
          deliveries,
          nextStageAt: plan.nextStageAt,
        });
        advanced += 1;
      } catch (error) {
        // One broken incident must not stop the sweep for everyone else.
        failed += 1;
        console.error("Escalation advance failed", { incidentId: id, error });
      }
    }

    return { checked: ids.length, advanced, failed };
  },
});
