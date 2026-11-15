import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Care programs published by the operator and browsed by customers.
    plans: defineTable({
      slug: v.string(),
      name: v.string(),
      tagline: v.string(),
      category: v.string(),
      summary: v.string(),
      price: v.number(),
      unit: v.string(),
      languages: v.array(v.string()),
      features: v.array(v.string()),
      specs: v.array(v.object({ label: v.string(), value: v.string() })),
      status: v.union(
        v.literal("published"),
        v.literal("draft"),
        v.literal("archived"),
      ),
      order: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_status", ["status"]),

    // Questions and notes left by customers on a program detail page.
    planComments: defineTable({
      planId: v.id("plans"),
      authorId: v.id("users"),
      authorName: v.string(),
      body: v.string(),
      createdAt: v.number(),
    })
      .index("by_plan", ["planId"])
      .index("by_author", ["authorId"]),

    // Every escalation is an append-only incident with the exact contacts used
    // at the time. The dashboard reads the latest few; the scheduler advances
    // anything still open after its grace window.
    escalations: defineTable({
      seniorId: v.id("seniors"),
      guardianId: v.id("users"),
      kind: v.union(v.literal("missed_dose"), v.literal("vitals")),
      stage: v.number(),
      status: v.union(
        v.literal("open"),
        v.literal("acknowledged"),
        v.literal("resolved"),
      ),
      trigger: v.string(),
      targets: v.object({
        seniorName: v.string(),
        seniorPhone: v.string(),
        guardianName: v.string(),
        guardianPhone: v.string(),
        localName: v.string(),
        localPhone: v.string(),
        hospital: v.string(),
        ambulancePhone: v.string(),
        address: v.string(),
      }),
      deliveries: v.array(
        v.object({
          stage: v.number(),
          channel: v.string(),
          target: v.string(),
          status: v.union(
            v.literal("sent"),
            v.literal("simulated"),
            v.literal("failed"),
          ),
          provider: v.string(),
          reference: v.optional(v.string()),
          error: v.optional(v.string()),
          summary: v.string(),
          at: v.number(),
        }),
      ),
      nextStageAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_senior", ["seniorId"])
      .index("by_status", ["status"]),

    // A senior enrolled by a signed-in guardian. One guardian can enrol more
    // than one parent; every senior is scoped to the guardian who owns it.
    seniors: defineTable({
      guardianId: v.id("users"),

      // Step 1 — who the AI will call
      fullName: v.string(),
      age: v.number(),
      gender: v.union(
        v.literal("female"),
        v.literal("male"),
        v.literal("other"),
      ),
      phone: v.string(),
      language: v.string(),

      // Step 2 — medical profile
      conditions: v.array(v.string()),
      medicalNotes: v.optional(v.string()),
      documents: v.array(
        v.object({
          name: v.string(),
          kind: v.string(),
          size: v.number(),
          storageId: v.optional(v.id("_storage")),
          uploadedAt: v.number(),
        }),
      ),

      // Step 3 — prescription parsing
      medications: v.array(
        v.object({
          key: v.string(),
          name: v.string(),
          dosage: v.string(),
          food: v.string(),
          times: v.array(v.string()),
          appearance: v.string(),
          location: v.string(),
        }),
      ),
      safetyFlags: v.array(v.string()),

      // Step 4 — escalation hierarchy
      emergency: v.object({
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
      }),

      // Background smartwatch sync (cloud health APIs). Sample readings are
      // seeded at enrolment so the dashboard has a baseline to compare against.
      deviceBrand: v.string(),
      deviceConnected: v.boolean(),
      lastSyncedAt: v.number(),
      vitals: v.array(
        v.object({ at: v.number(), hr: v.number(), spo2: v.number() }),
      ),
      sleepHours: v.number(),
      adherence7d: v.number(),

      createdAt: v.number(),
    }).index("by_guardian", ["guardianId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
