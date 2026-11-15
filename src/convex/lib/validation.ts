/**
 * Server-side validation for everything that enters the care record.
 *
 * The client is helpful, not trusted. Every mutation that writes medical data
 * passes through these guards so malformed or hostile payloads cannot reach the
 * database, and every phone number is normalised to E.164 before an escalation
 * ever tries to dial it.
 */
import type { Id } from "../_generated/dataModel";
import { normalizePhoneNumber, normalizeTime } from "./escalation";

export const FOOD_RELATIONS = [
  "Before food",
  "With food",
  "After food",
  "Anytime",
] as const;

export type FoodRelation = (typeof FOOD_RELATIONS)[number];

export type ValidatedMedication = {
  key: string;
  name: string;
  dosage: string;
  food: string;
  times: string[];
  appearance: string;
  location: string;
};

export type EmergencyInput = {
  primaryName: string;
  primaryRelation: string;
  primaryPhone: string;
  secondaryName: string;
  secondaryRelation: string;
  secondaryPhone: string;
  hospital: string;
  hospitalPhone: string;
  ambulance: string;
  address: string;
};

export type SeniorInput = {
  fullName: string;
  age: number;
  gender: "female" | "male" | "other";
  phone: string;
  language: string;
  conditions: string[];
  medicalNotes?: string;
  documents: {
    name: string;
    kind: string;
    size: number;
    storageId?: Id<"_storage">;
    uploadedAt: number;
  }[];
  medications: ValidatedMedication[];
  safetyFlags: string[];
  emergency: EmergencyInput;
};

function cleanText(
  value: string,
  field: string,
  min: number,
  max: number,
): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < min)
    throw new Error(`${field} must be at least ${min} characters.`);
  if (trimmed.length > max)
    throw new Error(`${field} must be under ${max} characters.`);
  return trimmed;
}

function optionalText(value: string | undefined, max: number): string {
  return (value ?? "").trim().slice(0, max);
}

/** Indian emergency short codes (108, 100, 102) are valid and must survive. */
export function normalizeEmergencyNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 15) return null;
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function validateMedications(input: {
  key: string;
  name: string;
  dosage: string;
  food: string;
  times: string[];
  appearance: string;
  location: string;
}[]): ValidatedMedication[] {
  if (input.length > 20)
    throw new Error("A care plan can hold at most 20 medicines.");
  if (input.length === 0) return [];

  return input.map((medication, index) => {
    const name = cleanText(medication.name || `Medicine ${index + 1}`, "Medicine name", 1, 80);
    const times = Array.from(
      new Set(
        (medication.times ?? [])
          .map(normalizeTime)
          .filter((time): time is string => Boolean(time)),
      ),
    ).sort();

    if (times.length === 0)
      throw new Error(`Add at least one valid call time for ${name}.`);

    const food = FOOD_RELATIONS.includes(medication.food as FoodRelation)
      ? medication.food
      : "Anytime";

    return {
      key: medication.key.slice(0, 64) || `med-${index}`,
      name,
      dosage: optionalText(medication.dosage, 40),
      food,
      times: times.slice(0, 4),
      appearance: optionalText(medication.appearance, 120),
      location: optionalText(medication.location, 120),
    };
  });
}

export function validateSeniorInput(input: SeniorInput): SeniorInput {
  const fullName = cleanText(input.fullName, "Full name", 2, 80);
  if (!Number.isInteger(input.age) || input.age < 40 || input.age > 120)
    throw new Error("Age must be whole years between 40 and 120.");

  const phone = normalizePhoneNumber(input.phone);
  if (!phone)
    throw new Error(
      "Enter a valid phone number with 10 to 15 digits for the AI to call.",
    );

  const language = cleanText(input.language, "Preferred language", 2, 40);
  if (input.conditions.length > 20)
    throw new Error("Select at most 20 chronic conditions.");
  const conditions = input.conditions.map((condition) =>
    cleanText(condition, "Condition", 2, 60),
  );

  if (input.documents.length > 20)
    throw new Error("Attach at most 20 medical documents.");
  const documents = input.documents.map((document) => ({
    ...document,
    name: document.name.trim().slice(0, 160) || "Document",
  }));

  const medications = validateMedications(input.medications);

  const emergency = input.emergency;
  const primaryName = cleanText(emergency.primaryName, "Primary guardian name", 2, 80);
  const primaryPhone = normalizePhoneNumber(emergency.primaryPhone);
  if (!primaryPhone)
    throw new Error("Add a valid phone number for the primary guardian.");

  const secondaryPhone = emergency.secondaryPhone.trim()
    ? normalizePhoneNumber(emergency.secondaryPhone)
    : "";
  if (emergency.secondaryPhone.trim() && !secondaryPhone)
    throw new Error("Add a valid phone number for the local contact.");

  const hospitalPhone = emergency.hospitalPhone.trim()
    ? normalizePhoneNumber(emergency.hospitalPhone) ?? emergency.hospitalPhone.trim()
    : "";

  const ambulance =
    normalizeEmergencyNumber(emergency.ambulance) ?? "108";

  const address = cleanText(emergency.address, "Home address", 8, 240);

  return {
    fullName,
    age: input.age,
    gender: input.gender,
    phone,
    language,
    conditions,
    medicalNotes: optionalText(input.medicalNotes, 2000) || undefined,
    documents,
    medications,
    safetyFlags: input.safetyFlags
      .slice(0, 30)
      .map((flag) => optionalText(flag, 200))
      .filter(Boolean),
    emergency: {
      primaryName,
      primaryRelation: optionalText(emergency.primaryRelation, 40) || "Guardian",
      primaryPhone,
      secondaryName: optionalText(emergency.secondaryName, 80),
      secondaryRelation: optionalText(emergency.secondaryRelation, 40),
      secondaryPhone: secondaryPhone ?? "",
      hospital: optionalText(emergency.hospital, 120),
      hospitalPhone,
      ambulance,
      address,
    },
  };
}
