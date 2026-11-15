import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateSeniorInput } from "./lib/validation";

const medicationValidator = v.object({
  key: v.string(),
  name: v.string(),
  dosage: v.string(),
  food: v.string(),
  times: v.array(v.string()),
  appearance: v.string(),
  location: v.string(),
});

const documentValidator = v.object({
  name: v.string(),
  kind: v.string(),
  size: v.number(),
  storageId: v.optional(v.id("_storage")),
  uploadedAt: v.number(),
});

const emergencyValidator = v.object({
  primaryName: v.string(),
  primaryRelation: v.string(),
  primaryPhone: v.string(),
  secondaryName: v.string(),
  secondaryRelation: v.string(),
  secondaryPhone: v.string(),
  hospital: v.string(),
  hospitalPhone: v.string(),
  ambulance: v.string(),
  address: v.string(),
});

/** Deterministic PRNG so the seeded baseline is stable per senior. */
function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedVitals(seed: number, now: number) {
  const random = seededRandom(seed);
  const hour = 60 * 60 * 1000;
  const points: { at: number; hr: number; spo2: number }[] = [];
  let hr = 68;

  for (let i = 35; i >= 0; i--) {
    // Gentle circadian drift plus small noise — a resting overnight baseline.
    const drift = Math.sin((i / 35) * Math.PI * 1.4) * 6;
    hr = Math.max(56, Math.min(92, 67 + drift + (random() - 0.5) * 9));
    const spo2 = Math.round(97 + (random() - 0.45) * 3);
    points.push({
      at: now - i * hour,
      hr: Math.round(hr),
      spo2: Math.max(94, Math.min(100, spo2)),
    });
  }

  return points;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to upload documents.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("seniors")
      .withIndex("by_guardian", (q) => q.eq("guardianId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    fullName: v.string(),
    age: v.number(),
    gender: v.union(v.literal("female"), v.literal("male"), v.literal("other")),
    phone: v.string(),
    language: v.string(),
    conditions: v.array(v.string()),
    medicalNotes: v.optional(v.string()),
    documents: v.array(documentValidator),
    medications: v.array(medicationValidator),
    safetyFlags: v.array(v.string()),
    emergency: emergencyValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to enrol a senior.");

    // Normalisation and bounds checks happen server-side, not just in the form.
    const senior = validateSeniorInput({
      ...args,
      medicalNotes: args.medicalNotes,
      documents: args.documents,
    });

    const now = Date.now();
    const seed = Math.abs(
      senior.phone.split("").reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7),
    );

    return await ctx.db.insert("seniors", {
      guardianId: userId,
      fullName: senior.fullName,
      age: senior.age,
      gender: senior.gender,
      phone: senior.phone,
      language: senior.language,
      conditions: senior.conditions,
      medicalNotes: senior.medicalNotes,
      documents: senior.documents,
      medications: senior.medications,
      safetyFlags: senior.safetyFlags,
      emergency: senior.emergency,
      deviceBrand: "Fire-Boltt",
      deviceConnected: true,
      lastSyncedAt: now,
      vitals: seedVitals(seed, now),
      sleepHours: Math.round((6.4 + (seed % 90) / 90) * 10) / 10,
      adherence7d: 88 + (seed % 9),
      createdAt: now,
    });
  },
});
