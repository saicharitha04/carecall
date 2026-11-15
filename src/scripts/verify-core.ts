/**
 * Domain verification for the parts of CareCall where a silent mistake is
 * dangerous: escalation timing and routing, phone/time normalisation, medication
 * validation, and multilingual script fallback.
 *
 * Run with `bun run verify`. Uses node:assert so it adds no dependency.
 */
import assert from "node:assert/strict";
import {
  ESCALATION_TIMING,
  assessVitals,
  initialStage,
  nextStage,
  normalizePhoneNumber,
  normalizeTime,
  planStage,
  type EmergencyTargets,
  type VitalsReading,
} from "../convex/lib/escalation";
import {
  validateMedications,
  validateSeniorInput,
} from "../convex/lib/validation";
import { buildMedicationScript } from "../convex/lib/voice";

let checks = 0;
function check(label: string, run: () => void) {
  run();
  checks += 1;
  console.log(`ok  ${label}`);
}

const now = Date.UTC(2026, 10, 15, 9, 0, 0);

const targets: EmergencyTargets = {
  seniorName: "Lakshmi Devi",
  seniorPhone: "+919876543210",
  guardianName: "Ravi Kumar",
  guardianPhone: "+919876500000",
  localName: "Sunita Rao",
  localPhone: "+919876511111",
  hospital: "KIMS Hospital",
  ambulancePhone: "108",
  address: "Flat 2B, Ameerpet, Hyderabad",
};

const normalReading: VitalsReading = { at: now, hr: 78, spo2: 97 };
const criticalReading: VitalsReading = { at: now, hr: 132, spo2: 88 };

check("normal vitals are not critical", () => {
  const assessment = assessVitals(normalReading);
  assert.equal(assessment.critical, false);
  assert.deepEqual(assessment.reasons, []);
});

check("critical vitals report every breached threshold", () => {
  const assessment = assessVitals(criticalReading);
  assert.equal(assessment.critical, true);
  assert.equal(assessment.reasons.length, 2);
});

check("a missed dose starts at the retry stage", () => {
  assert.equal(initialStage("missed_dose", assessVitals(normalReading)), 1);
});

check("critical vitals skip straight to the guardian", () => {
  assert.equal(initialStage("vitals", assessVitals(criticalReading)), 2);
  assert.equal(initialStage("vitals", assessVitals(normalReading)), 1);
});

check("the ladder stops at stage 3", () => {
  assert.equal(nextStage(1), 2);
  assert.equal(nextStage(2), 3);
  assert.equal(nextStage(3), null);
});

check("stage 1 retries the senior and sets a ten-minute window", () => {
  const plan = planStage({ stage: 1, kind: "missed_dose", targets, now });
  assert.equal(plan.deliveries.length, 1);
  assert.equal(plan.deliveries[0].channel, "voice");
  assert.equal(plan.deliveries[0].target, targets.seniorPhone);
  assert.equal(plan.nextStageAt, now + ESCALATION_TIMING.stage1RetryMs);
  assert.deepEqual(plan.warnings, []);
});

check("stage 2 reaches the guardian on both messaging channels", () => {
  const plan = planStage({ stage: 2, kind: "missed_dose", targets, now });
  assert.deepEqual(
    plan.deliveries.map((delivery) => delivery.channel),
    ["whatsapp", "sms"],
  );
  assert.ok(plan.deliveries.every((d) => d.target === targets.guardianPhone));
  assert.equal(plan.nextStageAt, now + ESCALATION_TIMING.stage2GuardianGraceMs);
});

check("stage 3 routes Tier A locally and Tier B to the ambulance", () => {
  const plan = planStage({ stage: 3, kind: "vitals", targets, now });
  assert.deepEqual(
    plan.deliveries.map((delivery) => delivery.channel),
    ["whatsapp", "sms", "ambulance"],
  );
  assert.equal(plan.nextStageAt, undefined);
});

check("a missing contact warns but never aborts the stage", () => {
  const plan = planStage({
    stage: 3,
    kind: "missed_dose",
    targets: { ...targets, localPhone: "", ambulancePhone: "" },
    now,
  });
  assert.equal(plan.deliveries.length, 0);
  assert.equal(plan.warnings.length, 2);
});

check("phone numbers normalise to E.164", () => {
  assert.equal(normalizePhoneNumber("9876543210"), "+919876543210");
  assert.equal(normalizePhoneNumber("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhoneNumber("0091 9876543210"), "+00919876543210");
  assert.equal(normalizePhoneNumber("12345"), null);
  assert.equal(normalizePhoneNumber(""), null);
});

check("times normalise to 24-hour HH:MM", () => {
  assert.equal(normalizeTime("8:30 pm"), "20:30");
  assert.equal(normalizeTime("12:00 am"), "00:00");
  assert.equal(normalizeTime("12:30 PM"), "12:30");
  assert.equal(normalizeTime("9"), "09:00");
  assert.equal(normalizeTime("25:00"), null);
  assert.equal(normalizeTime("8:75"), null);
  assert.equal(normalizeTime(null), null);
});

check("medication validation sorts, dedupes and normalises", () => {
  const result = validateMedications([
    {
      key: "m1",
      name: "  Metformin  ",
      dosage: "500 mg",
      food: "After food",
      times: ["8:30 pm", "08:30", "8:30 pm"],
      appearance: "white oval tablet",
      location: "kitchen drawer",
    },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Metformin");
  assert.deepEqual(result[0].times, ["08:30", "20:30"]);
});

check("a medicine without a readable time is rejected", () => {
  assert.throws(
    () =>
      validateMedications([
        {
          key: "m1",
          name: "Metformin",
          dosage: "500 mg",
          food: "After food",
          times: ["not a time"],
          appearance: "",
          location: "",
        },
      ]),
    /valid call time/,
  );
});

check("senior validation normalises contacts and medications", () => {
  const result = validateSeniorInput({
    fullName: "  Lakshmi   Devi ",
    age: 74,
    gender: "female",
    phone: "9876543210",
    language: "Telugu",
    conditions: ["Diabetes"],
    medicalNotes: "",
    documents: [],
    medications: [
      {
        key: "m1",
        name: "Metformin",
        dosage: "500 mg",
        food: "After food",
        times: ["8:30 pm"],
        appearance: "white oval tablet",
        location: "kitchen drawer",
      },
    ],
    safetyFlags: ["Sugar restricted"],
    emergency: {
      primaryName: "Ravi Kumar",
      primaryRelation: "Son",
      primaryPhone: "9876500000",
      secondaryName: "Sunita Rao",
      secondaryRelation: "Neighbour",
      secondaryPhone: "9876511111",
      hospital: "KIMS Hospital",
      hospitalPhone: "04012345678",
      ambulance: "108",
      address: "Flat 2B, Ameerpet, Hyderabad",
    },
  });

  assert.equal(result.fullName, "Lakshmi Devi");
  assert.equal(result.phone, "+919876543210");
  assert.equal(result.emergency.primaryPhone, "+919876500000");
  assert.equal(result.emergency.ambulance, "108");
  assert.deepEqual(result.medications[0].times, ["20:30"]);
});

check("senior validation rejects implausible ages and bad guardians", () => {
  const base = {
    fullName: "Lakshmi Devi",
    age: 30,
    gender: "female" as const,
    phone: "9876543210",
    language: "Telugu",
    conditions: [],
    documents: [],
    medications: [],
    safetyFlags: [],
    emergency: {
      primaryName: "Ravi Kumar",
      primaryRelation: "Son",
      primaryPhone: "9876500000",
      secondaryName: "",
      secondaryRelation: "",
      secondaryPhone: "",
      hospital: "",
      hospitalPhone: "",
      ambulance: "108",
      address: "Flat 2B, Ameerpet, Hyderabad",
    },
  };

  assert.throws(() => validateSeniorInput(base), /Age must be/);
  assert.throws(
    () =>
      validateSeniorInput({
        ...base,
        age: 74,
        emergency: { ...base.emergency, primaryPhone: "123" },
      }),
    /primary guardian/,
  );
});

check("the Telugu script uses the reviewed template and the care record", () => {
  const script = buildMedicationScript({
    language: "Telugu",
    seniorName: "Lakshmi Devi",
    medicine: "Metformin",
    dosage: "500 mg",
    food: "After food",
    appearance: "white oval tablet",
    location: "kitchen drawer",
  });
  const spoken = script.lines.join(" ");
  assert.equal(script.spokenLanguage, "Telugu");
  assert.equal(script.fallback, false);
  assert.ok(spoken.includes("Metformin 500 mg"));
  assert.ok(spoken.includes("kitchen drawer"));
  assert.ok(script.confirmationPrompt.includes("1"));
});

check("an unreviewed language falls back to English explicitly", () => {
  const script = buildMedicationScript({
    language: "Bengali",
    seniorName: "Lakshmi Devi",
    medicine: "Metformin",
    dosage: "500 mg",
    food: "After food",
    appearance: "",
    location: "",
  });
  assert.equal(script.spokenLanguage, "English");
  assert.equal(script.fallback, true);
  assert.ok(script.guardrails.some((line) => line.includes("Bengali")));
  assert.ok(script.guardrails.some((line) => line.includes("Physical description")));
});

console.log(`\n${checks} domain checks passed.`);
