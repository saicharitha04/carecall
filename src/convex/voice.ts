import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { buildMedicationScript } from "./lib/voice";

/**
 * Returns the exact script the voice agent is allowed to speak for one
 * medication. Authorisation is checked against the guardian who owns the care
 * plan; the script itself is derived only from stored prescription fields.
 */
export const getMedicationScript = query({
  args: { seniorId: v.id("seniors"), medicationKey: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const senior = await ctx.db.get(args.seniorId);
    if (!senior || senior.guardianId !== userId) return null;

    const medication = senior.medications.find(
      (item) => item.key === args.medicationKey,
    );
    if (!medication) return null;

    return buildMedicationScript({
      language: senior.language,
      seniorName: senior.fullName,
      medicine: medication.name,
      dosage: medication.dosage,
      food: medication.food,
      appearance: medication.appearance,
      location: medication.location,
      guardrails: senior.safetyFlags,
    });
  },
});
