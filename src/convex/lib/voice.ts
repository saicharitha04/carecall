/**
 * Multilingual voice-agent script builder.
 *
 * The spoken script is deliberately assembled from reviewed phrase templates
 * rather than generated freely at call time. A model may improvise in a
 * conversation, but the medical instructions — medicine, dose, food relation,
 * colour, shape and location — must come from the care record and nowhere else.
 *
 * Languages without a reviewed template fall back to English explicitly; the
 * result says so, so the guardian is never misled about what will be spoken.
 */

export type VoiceScriptInput = {
  language: string;
  seniorName: string;
  medicine: string;
  dosage: string;
  food: string;
  appearance: string;
  location: string;
  guardrails?: string[];
};

export type VoiceScript = {
  requestedLanguage: string;
  spokenLanguage: string;
  fallback: boolean;
  lines: string[];
  confirmationPrompt: string;
  guardrails: string[];
};

type ReviewedLanguage = "Telugu" | "Hindi" | "Tamil" | "English";

const REVIEWED: ReviewedLanguage[] = ["Telugu", "Hindi", "Tamil", "English"];

const FOOD_PHRASES: Record<
  ReviewedLanguage,
  { before: string; after: string; with: string; anytime: string }
> = {
  Telugu: {
    before: "భోజనానికి ముందు",
    after: "భోజనం తర్వాత",
    with: "భోజనంతో కలిపి",
    anytime: "ఎప్పుడైనా",
  },
  Hindi: {
    before: "खाने से पहले",
    after: "खाने के बाद",
    with: "खाने के साथ",
    anytime: "कभी भी",
  },
  Tamil: {
    before: "உணவுக்கு முன்",
    after: "உணவுக்குப் பிறகு",
    with: "உணவுடன்",
    anytime: "எப்போதும்",
  },
  English: {
    before: "before food",
    after: "after food",
    with: "with food",
    anytime: "at any time",
  },
};

function resolveLanguage(language: string): {
  spoken: ReviewedLanguage;
  fallback: boolean;
} {
  const match = REVIEWED.find(
    (candidate) => candidate.toLowerCase() === language.trim().toLowerCase(),
  );
  return match ? { spoken: match, fallback: false } : { spoken: "English", fallback: true };
}

function foodKey(food: string): keyof (typeof FOOD_PHRASES)["English"] {
  const normalized = food.toLowerCase();
  if (normalized.includes("before")) return "before";
  if (normalized.includes("after")) return "after";
  if (normalized.includes("with")) return "with";
  return "anytime";
}

export function buildMedicationScript(input: VoiceScriptInput): VoiceScript {
  const { spoken, fallback } = resolveLanguage(input.language);
  const food = FOOD_PHRASES[spoken][foodKey(input.food)];
  const medicine = [input.medicine, input.dosage].filter(Boolean).join(" ");
  const place = input.location.trim();
  const looksLike = input.appearance.trim();

  let lines: string[];
  let confirmationPrompt: string;

  if (spoken === "Telugu") {
    lines = [
      `నమస్కారం ${input.seniorName}. మీ మందు సమయం అయింది.`,
      `${medicine} ${food} తీసుకోండి.`,
    ];
    if (looksLike || place)
      lines.push(
        `ఈ మాత్ర ${looksLike || "మీ మందుల పెట్టెలో"} ఉంది${place ? `, ${place} లో` : ""}.`,
      );
    confirmationPrompt =
      "తీసుకున్నారా? అవును అంటే 1 నొక్కండి, ప్రశ్న ఉంటే 2 నొక్కండి.";
  } else if (spoken === "Hindi") {
    lines = [
      `नमस्ते ${input.seniorName}. आपकी दवा का समय हो गया है।`,
      `${medicine} ${food} ले लीजिए।`,
    ];
    if (looksLike || place)
      lines.push(
        `यह गोली ${looksLike || "आपकी दवा के डिब्बे में"} है${place ? `, ${place} में` : ""}।`,
      );
    confirmationPrompt =
      "क्या आपने ले ली? हाँ के लिए 1 दबाएँ, सवाल के लिए 2 दबाएँ।";
  } else if (spoken === "Tamil") {
    lines = [
      `வணக்கம் ${input.seniorName}. உங்கள் மருந்து நேரம் வந்துவிட்டது.`,
      `${medicine} ${food} எடுத்துக்கொள்ளுங்கள்.`,
    ];
    if (looksLike || place)
      lines.push(
        `இந்த மாத்திரை ${looksLike || "உங்கள் மருந்து பெட்டியில்"} உள்ளது${place ? `, ${place} இல்` : ""}.`,
      );
    confirmationPrompt =
      "எடுத்துக்கொண்டீர்களா? ஆம் என்றால் 1 அழுத்தவும், கேள்விக்கு 2 அழுத்தவும்.";
  } else {
    lines = [
      `Hello ${input.seniorName}. It is time for your medicine.`,
      `Please take ${medicine} ${food}.`,
    ];
    if (looksLike || place)
      lines.push(
        `The tablet is ${looksLike || "in your medicine box"}${place ? `, kept in ${place}` : ""}.`,
      );
    confirmationPrompt =
      "Have you taken it? Press 1 for yes, or 2 to ask a question.";
  }

  const guardrails = [
    ...(input.guardrails ?? []),
    fallback
      ? `No reviewed ${input.language} script exists yet; the English template is used.`
      : null,
    !looksLike ? "Physical description is missing; add colour and shape." : null,
    !place ? "Storage location is missing; add where the strip is kept." : null,
    "The agent must not change a dose, and must escalate chest pain or breathlessness.",
  ].filter((line): line is string => Boolean(line));

  return {
    requestedLanguage: input.language,
    spokenLanguage: spoken,
    fallback,
    lines,
    confirmationPrompt,
    guardrails,
  };
}
