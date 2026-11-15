"use node";

/**
 * Prescription Vision AI.
 *
 * Reads an uploaded prescription image and returns a strict, validated list of
 * medicines. The model is treated as an untrusted parser: everything it returns
 * is checked, normalised and bounded before it can reach a care plan.
 *
 * Production requirements:
 *   OPENAI_API_KEY          server-side key, never exposed to the client
 *   OPENAI_VISION_MODEL     optional, defaults to gpt-4o-mini
 *
 * When no key is configured, the action returns a `fallback` result instead of
 * throwing. The UI then loads an editable template so a guardian is never
 * blocked by a provider outage.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { action } from "./_generated/server";
import { normalizeTime } from "./lib/escalation";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;
const MODEL = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

export type ExtractedMedication = {
  key: string;
  name: string;
  dosage: string;
  food: string;
  times: string[];
  appearance: string;
  location: string;
};

export type AnalyzeResult =
  | {
      status: "ok";
      medications: ExtractedMedication[];
      warnings: string[];
      model: string;
    }
  | { status: "fallback"; reason: string };

const SYSTEM_PROMPT = `You are a careful prescription transcription assistant for an elder-care system.
Return ONLY a JSON object with this exact shape:
{"medications":[{"name":"Metformin","dosage":"500 mg","food":"after","times":["08:30","20:30"],"appearance":"white, oval tablet","location":"kitchen drawer"}]}

Rules:
- Transcribe only what is legible. Never invent a medicine, dose or time.
- "food" must be one of: before, after, with, anytime.
- "times" must use 24-hour HH:MM. Split multiple times into separate entries.
- "appearance" describes colour and shape if the slip says so, otherwise "".
- "location" is "", because the guardian supplies where the strip is kept.
- Do not include commentary, markdown or medical advice outside the JSON.`;

const responseSchema = z.object({
  medications: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        dosage: z.string().max(40).optional().default(""),
        food: z.string().max(20).optional().default("anytime"),
        times: z.array(z.string()).max(6).optional().default([]),
        appearance: z.string().max(120).optional().default(""),
        location: z.string().max(120).optional().default(""),
      }),
    )
    .min(1)
    .max(20),
});

function normalizeFood(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("before")) return "Before food";
  if (normalized.includes("after")) return "After food";
  if (normalized.includes("with")) return "With food";
  return "Anytime";
}

/** Extract the JSON object even if the model wraps it in prose or a fence. */
function readJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start)
    throw new Error("The vision response did not contain a JSON object.");
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callVision(input: {
  apiKey: string;
  dataUrl: string;
}): Promise<string> {
  let lastError: unknown;

  // One retry is enough to ride out a transient provider blip without keeping
  // a guardian waiting on a dead request.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcribe every medicine on this prescription slip.",
                },
                { type: "image_url", image_url: { url: input.dataUrl } },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Vision provider responded ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`,
        );
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("The vision provider returned an empty response.");
      return content;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("The vision provider could not be reached.");
}

function validateExtraction(text: string): AnalyzeResult {
  const raw = readJson(text);
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success)
    return {
      status: "fallback",
      reason: "The vision response did not match the expected prescription format.",
    };

  const warnings: string[] = [];
  const medications: ExtractedMedication[] = [];

  for (const medication of parsed.data.medications) {
    const times = Array.from(
      new Set(
        medication.times
          .map(normalizeTime)
          .filter((time): time is string => Boolean(time)),
      ),
    ).sort();

    if (times.length === 0) {
      warnings.push(`${medication.name} had no readable timing and was skipped.`);
      continue;
    }

    if (!medication.appearance)
      warnings.push(
        `No colour or shape was readable for ${medication.name}; add physical guidance before the first call.`,
      );

    medications.push({
      key: randomUUID(),
      name: medication.name.trim(),
      dosage: medication.dosage.trim(),
      food: normalizeFood(medication.food),
      times,
      appearance: medication.appearance.trim(),
      location: medication.location.trim(),
    });
  }

  if (medications.length === 0)
    return {
      status: "fallback",
      reason: "No medicine with a readable schedule was found on the slip.",
    };

  return { status: "ok", medications, warnings, model: MODEL };
}

export const analyzePrescription = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args): Promise<AnalyzeResult> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to analyse a prescription.");

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey)
      return {
        status: "fallback",
        reason:
          "Vision AI is not configured on this deployment. Loaded an editable template instead.",
      };

    const blob = await ctx.storage.get(args.storageId);
    if (!blob)
      return { status: "fallback", reason: "The uploaded file could not be read." };
    if (blob.size > MAX_IMAGE_BYTES)
      throw new Error("Prescription images must be under 8 MB.");
    if (!blob.type.startsWith("image/"))
      return {
        status: "fallback",
        reason: "Only image prescriptions can be read automatically. Loaded a template instead.",
      };

    try {
      const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
      const text = await callVision({
        apiKey,
        dataUrl: `data:${blob.type};base64,${base64}`,
      });
      return validateExtraction(text);
    } catch (error) {
      // Provider failures are expected in the field. Degrade to the editable
      // template rather than losing the guardian's upload.
      return {
        status: "fallback",
        reason:
          error instanceof Error
            ? `Vision AI could not read this slip: ${error.message}`
            : "Vision AI could not read this slip.",
      };
    }
  },
});
