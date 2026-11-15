/**
 * Alert delivery adapters.
 *
 * All external I/O for the escalation matrix goes through this file. The
 * contract is deliberately forgiving: a delivery never throws, it returns a
 * structured outcome so one failed channel can never abort the rest of the
 * safety net. When provider credentials are absent — locally, in CI, or in a
 * demo deployment — deliveries are recorded as `simulated` instead of silently
 * pretending to have been sent.
 */
import type { DeliveryChannel } from "./escalation";

export type DeliveryOutcome = {
  status: "sent" | "simulated" | "failed";
  provider: string;
  reference?: string;
  error?: string;
};

export type DeliveryRequest = {
  channel: DeliveryChannel;
  target: string;
  summary: string;
};

const TIMEOUT_MS = 8_000;

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function twilioConfig() {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const authToken = env("TWILIO_AUTH_TOKEN");
  const fromSms = env("TWILIO_FROM_NUMBER");
  const fromWhatsApp = env("TWILIO_WHATSAPP_FROM");
  return { accountSid, authToken, fromSms, fromWhatsApp };
}

async function postForm(
  url: string,
  form: Record<string, string>,
  authorization: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(form).toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Twilio returns useful diagnostics in the body; keep it short and avoid
      // echoing any patient data into the error trail.
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Provider responded ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ""}`,
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function referenceOf(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "sid" in payload) {
    const sid = (payload as { sid?: unknown }).sid;
    if (typeof sid === "string") return sid;
  }
  return undefined;
}

async function sendMessage(
  channel: "sms" | "whatsapp",
  target: string,
  summary: string,
): Promise<DeliveryOutcome> {
  const { accountSid, authToken, fromSms, fromWhatsApp } = twilioConfig();
  const from = channel === "whatsapp" ? fromWhatsApp : fromSms;

  if (!accountSid || !authToken || !from) {
    return {
      status: "simulated",
      provider: "simulator",
      error: "Twilio credentials are not configured.",
    };
  }

  const to = channel === "whatsapp" ? `whatsapp:${target}` : target;
  const fromAddress = channel === "whatsapp" ? `whatsapp:${from}` : from;

  try {
    const payload = await postForm(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      { To: to, From: fromAddress, Body: summary },
      `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    );
    return { status: "sent", provider: "twilio", reference: referenceOf(payload) };
  } catch (error) {
    return {
      status: "failed",
      provider: "twilio",
      error: error instanceof Error ? error.message : "Unknown provider error",
    };
  }
}

async function placeCall(
  target: string,
  summary: string,
  provider: "twilio" | "ambulance-webhook",
): Promise<DeliveryOutcome> {
  // A dispatch webhook is the preferred path when a deployment has a live
  // ambulance partner. It receives a minimal JSON payload and decides how to
  // reach the desk on its side.
  const webhook = env("AMBULANCE_DISPATCH_WEBHOOK_URL");
  if (provider === "ambulance-webhook" && webhook) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env("AMBULANCE_DISPATCH_TOKEN")
            ? { Authorization: `Bearer ${env("AMBULANCE_DISPATCH_TOKEN")}` }
            : {}),
        },
        body: JSON.stringify({ to: target, message: summary }),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(`Dispatch webhook responded ${response.status}`);
      return { status: "sent", provider: "ambulance-webhook" };
    } catch (error) {
      return {
        status: "failed",
        provider: "ambulance-webhook",
        error: error instanceof Error ? error.message : "Dispatch failed",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  const { accountSid, authToken, fromSms } = twilioConfig();
  const voiceWebhook = env("TWILIO_VOICE_WEBHOOK_URL");

  // Programmable voice requires a TwiML endpoint that renders the spoken script
  // in the senior's language. Without that endpoint we must not claim a call.
  if (!accountSid || !authToken || !fromSms || !voiceWebhook) {
    return {
      status: "simulated",
      provider: "simulator",
      error:
        "Voice provider is not configured. Add Twilio credentials and a TwiML webhook.",
    };
  }

  try {
    const payload = await postForm(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      { To: target, From: fromSms, Url: voiceWebhook, Method: "POST" },
      `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    );
    return { status: "sent", provider: "twilio-voice", reference: referenceOf(payload) };
  } catch (error) {
    return {
      status: "failed",
      provider: "twilio-voice",
      error: error instanceof Error ? error.message : "Unknown provider error",
    };
  }
}

/** Dispatch one delivery. Never throws; the caller records the outcome. */
export async function dispatchDelivery(
  request: DeliveryRequest,
): Promise<DeliveryOutcome> {
  try {
    if (request.channel === "sms" || request.channel === "whatsapp") {
      return await sendMessage(
        request.channel,
        request.target,
        request.summary,
      );
    }
    return await placeCall(
      request.target,
      request.summary,
      request.channel === "ambulance" ? "ambulance-webhook" : "twilio",
    );
  } catch (error) {
    return {
      status: "failed",
      provider: "unknown",
      error: error instanceof Error ? error.message : "Unknown delivery error",
    };
  }
}

/** True when at least one real delivery path is configured. */
export function messagingConfigured(): boolean {
  const { accountSid, authToken, fromSms, fromWhatsApp } = twilioConfig();
  return Boolean(accountSid && authToken && (fromSms || fromWhatsApp));
}
