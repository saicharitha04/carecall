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
