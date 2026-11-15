/**
 * CareCall escalation domain.
 *
 * This module is intentionally pure: no database, no network, no React. The
 * three-stage safety net is the most safety-critical part of the product, so
 * the decision logic lives here where it can be reasoned about and verified in
 * isolation. Convex actions are responsible only for loading data, calling this
 * module, dispatching deliveries and persisting the audit trail.
 *
 * Stage 1 — retry the senior and log non-adherence.
 * Stage 2 — alert the primary guardian by WhatsApp and SMS.
 * Stage 3 — Tier A: alert a local contact. Tier B: call the ambulance desk.
 */

export type EscalationKind = "missed_dose" | "vitals";
export type EscalationStage = 1 | 2 | 3;
export type DeliveryChannel = "voice" | "whatsapp" | "sms" | "ambulance";

/** How long the system waits before escalating on its own. */
export const ESCALATION_TIMING = {
  stage1RetryMs: 10 * 60 * 1000,
  stage2GuardianGraceMs: 15 * 60 * 1000,
} as const;

/**
 * Conservative adult thresholds. A real deployment should widen or narrow these
 * per senior, based on the baseline the smartwatch sync establishes.
 */
export const VITAL_LIMITS = {
  heartRateHigh: 120,
  heartRateLow: 45,
  spo2Low: 90,
} as const;

export type VitalsReading = {
  at: number;
  hr: number;
  spo2: number;
};

export type VitalsAssessment = {
  critical: boolean;
  reasons: string[];
};

export type EmergencyTargets = {
  seniorName: string;
  seniorPhone: string;
  guardianName: string;
  guardianPhone: string;
  localName: string;
  localPhone: string;
  hospital: string;
  ambulancePhone: string;
  address: string;
};

export type PlannedDelivery = {
  stage: EscalationStage;
  channel: DeliveryChannel;
  target: string;
  summary: string;
};

export type StagePlan = {
  deliveries: PlannedDelivery[];
  warnings: string[];
  nextStageAt?: number;
};

export const STAGE_TITLES: Record<EscalationStage, string> = {
  1: "Retry the senior",
  2: "Alert the primary guardian",
  3: "Route to neighbour and ambulance",
};

export function assessVitals(reading: VitalsReading): VitalsAssessment {
  const reasons: string[] = [];

  if (reading.hr >= VITAL_LIMITS.heartRateHigh)
    reasons.push(`Heart rate ${reading.hr} bpm is above the safe ceiling`);
  if (reading.hr <= VITAL_LIMITS.heartRateLow)
    reasons.push(`Heart rate ${reading.hr} bpm is below the safe floor`);
  if (reading.spo2 <= VITAL_LIMITS.spo2Low)
    reasons.push(`Blood oxygen ${reading.spo2}% is below the safe floor`);

  return { critical: reasons.length > 0, reasons };
}

/**
 * Critical vitals skip the retry stage: if the body is already in trouble, the
 * guardian must hear about it immediately. Everything else starts at stage 1.
 */
export function initialStage(
  kind: EscalationKind,
  assessment: VitalsAssessment,
): EscalationStage {
  return kind === "vitals" && assessment.critical ? 2 : 1;
}

export function nextStage(stage: EscalationStage): EscalationStage | null {
  if (stage === 1) return 2;
  if (stage === 2) return 3;
  return null;
}

function summarize(
  stage: EscalationStage,
  kind: EscalationKind,
  targets: EmergencyTargets,
): string {
  const firstName = targets.seniorName.split(" ")[0] || targets.seniorName;

  if (stage === 1) {
    return `Medicine reminder for ${firstName}. Confirm after taking it. Reply 1 to confirm or 2 to ask a question.`;
  }
  if (stage === 2) {
    const trigger =
      kind === "vitals"
        ? `a critical vital reading for ${firstName}`
        : `an unconfirmed dose for ${firstName}`;
    return `CareCall alert: ${trigger}. Please call ${targets.seniorPhone} and confirm they are safe.`;
  }
  return `CareCall emergency: ${firstName} may need urgent help at ${targets.address}. Guardian ${targets.guardianName} has not confirmed. Nearest hospital: ${targets.hospital}.`;
}

/**
 * Build the delivery set for one stage. Missing contacts never abort the whole
 * escalation — they produce a warning and the remaining channels still fire.
 */
export function planStage(input: {
  stage: EscalationStage;
  kind: EscalationKind;
  targets: EmergencyTargets;
  now: number;
}): StagePlan {
  const { stage, kind, targets, now } = input;
  const summary = summarize(stage, kind, targets);
  const deliveries: PlannedDelivery[] = [];
  const warnings: string[] = [];

  if (stage === 1) {
    if (targets.seniorPhone) {
      deliveries.push({
        stage,
        channel: "voice",
        target: targets.seniorPhone,
        summary,
      });
    } else {
      warnings.push("No senior phone number on file — the retry cannot be placed.");
    }
    return {
      deliveries,
      warnings,
      nextStageAt: now + ESCALATION_TIMING.stage1RetryMs,
    };
  }

  if (stage === 2) {
    if (targets.guardianPhone) {
      for (const channel of ["whatsapp", "sms"] as const) {
        deliveries.push({
          stage,
          channel,
          target: targets.guardianPhone,
          summary,
        });
      }
    } else {
      warnings.push("No guardian phone number on file — stage 2 has no recipient.");
    }
    return {
      deliveries,
      warnings,
      nextStageAt: now + ESCALATION_TIMING.stage2GuardianGraceMs,
    };
  }

  if (targets.localPhone) {
    for (const channel of ["whatsapp", "sms"] as const) {
      deliveries.push({
        stage,
        channel,
        target: targets.localPhone,
        summary,
      });
    }
  } else {
    warnings.push(
      "No local neighbour or relative is registered — Tier A was skipped.",
    );
  }

  if (targets.ambulancePhone) {
    deliveries.push({
      stage,
      channel: "ambulance",
      target: targets.ambulancePhone,
      summary,
    });
  } else {
    warnings.push("No ambulance number on file — Tier B needs a manual call.");
  }

  return { deliveries, warnings };
}

/** Normalise Indian mobile numbers to E.164. Returns null when unusable. */
export function normalizePhoneNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;

  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

/** Accepts "8:30", "08:30", "8:30 pm" and returns a 24-hour "HH:MM". */
export function normalizeTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridiem = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return null;
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 23) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
