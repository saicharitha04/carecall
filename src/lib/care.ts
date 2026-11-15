export type Medication = {
  key: string;
  name: string;
  dosage: string;
  food: string;
  times: string[];
  appearance: string;
  location: string;
};

export const LANGUAGES = [
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
  "English",
] as const;

export const CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Heart condition",
  "Thyroid",
  "Arthritis",
  "Asthma / COPD",
  "Kidney disease",
  "Dementia / memory loss",
  "Osteoporosis",
  "High cholesterol",
] as const;

export const FOOD_OPTIONS = ["Before food", "With food", "After food", "Anytime"] as const;

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function formatTime12(value: string) {
  if (!value) return "—";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

export function formatPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return digits;
}

export function formatPrice(price: number) {
  if (price === 0) return "Custom";
  return `₹${price.toLocaleString("en-IN")}`;
}

export function relativeTime(timestamp: number) {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Guardrails derived from the medical profile + the parsed prescription.
 * These are shown to the guardian before activation and are attached to the
 * senior's profile so the call script can enforce them.
 */
export function deriveSafetyFlags(conditions: string[], medications: Medication[]) {
  const flags: string[] = [];
  const names = medications.map((med) => med.name.toLowerCase()).join(" ");

  if (conditions.includes("Diabetes"))
    flags.push(
      "Sugar restricted — no sweets, sweetened tea or fruit juice around medicine times.",
    );
  if (conditions.includes("Hypertension"))
    flags.push(
      "Low-salt guidance added to every call: no pickles, papad or extra salt with meals.",
    );
  if (conditions.includes("Heart condition"))
    flags.push(
      "Chest pain or breathlessness reported on a call escalates to the guardian immediately.",
    );
  if (conditions.includes("Kidney disease"))
    flags.push(
      "Every shell is flagged for kidney-safe dosing before the first call goes out.",
    );
  if (conditions.includes("Dementia / memory loss"))
    flags.push(
      "The AI will repeat the pill's colour and location twice, then wait for a spoken yes.",
    );
  if (names.includes("metformin"))
    flags.push(
      "Metformin is set to 'after food' — the call is timed after the meal window, never before.",
    );
  if (names.includes("thyronorm") || names.includes("thyroxine"))
    flags.push(
      "Thyroid tablet kept on an empty stomach, 30 minutes before morning tea.",
    );
  if (names.includes("aspirin") || names.includes("clopidogrel"))
    flags.push(
      "Blood thinner on file — any bruise or bleeding is sent to you as soon as it is reported.",
    );
  if (names.includes("insulin") || names.includes("glimepiride"))
    flags.push(
      "Low-sugar risk: the AI reads the signs of dizziness first and asks about the last meal.",
    );

  if (!flags.length)
    flags.push("No conflicting medicines found. Review the timings once before calls begin.");

  flags.push("A missed dose is never doubled — only the next scheduled dose is reminded.");
  return flags;
}

const PRESCRIPTION_SETS: Medication[][] = [
  [
    {
      key: "rx-metformin",
      name: "Metformin",
      dosage: "500 mg",
      food: "After food",
      times: ["08:30", "20:30"],
      appearance: "White, oval tablet",
      location: "White strip in the kitchen drawer, next to the tea tin",
    },
    {
      key: "rx-amlodipine",
      name: "Amlodipine",
      dosage: "5 mg",
      food: "Before food",
      times: ["08:00"],
      appearance: "Pink, round tablet",
      location: "Red box on the kitchen table",
    },
    {
      key: "rx-atorvastatin",
      name: "Atorvastatin",
      dosage: "10 mg",
      food: "After food",
      times: ["21:00"],
      appearance: "White, round tablet",
      location: "Blue pill organiser, Sunday night slot",
    },
  ],
  [
    {
      key: "rx-telmisartan",
      name: "Telmisartan",
      dosage: "40 mg",
      food: "After food",
      times: ["08:00"],
      appearance: "White, oblong tablet",
      location: "Steel tiffin box on the dining shelf",
    },
    {
      key: "rx-thyronorm",
      name: "Thyronorm",
      dosage: "25 mcg",
      food: "Before food",
      times: ["06:30"],
      appearance: "Small yellow tablet",
      location: "Bedside glass shelf, blue cap bottle",
    },
  ],
];

/**
 * Version 1 does not ship a vision model. This profiler produces the shape of
 * an extraction — medicine, dose, timing, physical description — so the
 * guardian can review and correct every field before activation. Swap the body
 * of this function for a real Vision AI action without touching the UI.
 */
export function profilePrescription(fileName: string): Medication[] {
  const name = fileName.toLowerCase();
  const set =
    name.includes("thyro") || name.includes("heart") || name.includes("bp")
      ? PRESCRIPTION_SETS[1]
      : PRESCRIPTION_SETS[0];

  return set.map((med) => ({ ...med, key: uid(), times: [...med.times] }));
}

export const ESCALATION_STAGES = [
  {
    stage: "Stage 1",
    title: "Missed dose handled at the phone",
    detail:
      "The AI calls again in 10 minutes. If the senior still does not confirm, the dose is logged as not taken — never assumed.",
  },
  {
    stage: "Stage 2",
    title: "You are told, wherever you are",
    detail:
      "A WhatsApp and SMS alert reaches the primary guardian with the dose, the time and the senior's latest vitals.",
  },
  {
    stage: "Stage 3",
    title: "The neighbourhood steps in",
    detail:
      "Tier A notifies a pre-registered neighbour or relative. Tier B triggers a call to the nearest ambulance desk with the home address.",
  },
] as const;
