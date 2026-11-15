# CareCall — Architecture

CareCall is a zero-app elder-care platform: an AI voice companion calls the senior
at medication times in their mother tongue, a smartwatch baseline is monitored in
the background, and a three-stage escalation ladder reaches a guardian, a
neighbour, and an ambulance desk. It is free for every family, with no paid tier.

- Frontend: React 19, Vite, React Router, Tailwind v4, shadcn/ui
- Backend: Convex (queries, mutations, actions, file storage, cron)
- Auth: Convex Auth (email OTP and anonymous guest sessions)
- Vision: OpenAI-compatible chat-completions endpoint, server-side only
- Messaging: Twilio REST (SMS/WhatsApp/voice) or a dispatch webhook

## Directory map

```
src/
  pages/                 Landing, Auth, Onboarding, Dashboard, Catalog, ProgramDetail, Admin
  components/
    EscalationPanel.tsx  Live safety-net log and drill control
    FreeBadge.tsx        The free-forever promise, reused across surfaces
    CareHeader.tsx       Public navigation + free-initiative banner
  convex/
    schema.ts            users, seniors, plans, planComments, escalations
    seniors.ts           Senior enrolment (validated) + reads
    escalations.ts       Escalation orchestration, audit trail, cron sweep
    prescriptions.ts     Vision AI action with validated fallback ("use node")
    voice.ts             Authorised medication-script preview
    catalog.ts           Free care programs, comments, rate limiting
    admin.ts             Role-gated admin overview and moderation
    crons.ts             Scheduled advancement of open escalations
    lib/
      escalation.ts      Pure three-stage state machine (no I/O)
      validation.ts      Server-side normalisation and bounds checks
      notify.ts          Provider adapters with simulation fallback
      voice.ts           Reviewed multilingual script templates
  scripts/
    verify-core.ts       Domain verification harness (bun run verify)
```

## The three-stage escalation engine

The safety net is the most safety-critical part of the product. Its decision logic
is a pure module (`convex/lib/escalation.ts`) so it can be reasoned about and
verified without a database, network, or browser.

| Stage | Trigger | Deliveries | Next rung |
| --- | --- | --- | --- |
| 1 | Missed dose, no confirmation | Voice retry to the senior | 10 minutes |
| 2 | Still unconfirmed | WhatsApp + SMS to the primary guardian | 15 minutes |
| 3 | Guardian unreachable, or critical vitals | WhatsApp + SMS to the local contact (Tier A); ambulance call or dispatch webhook (Tier B) | none |

Critical vital readings skip stage 1: `initialStage()` returns stage 2 immediately.
Thresholds live in `VITAL_LIMITS` (heart rate above 120 or below 45 bpm, SpO₂ at or
below 90%) and are intentionally conservative; production deployments should widen
them per senior once a baseline exists.

**Why silence escalates.** `crons.ts` runs `escalations.processDue` every two
minutes. Any incident still open past `nextStageAt` advances automatically. A
guardian who is asleep, offline, or in another timezone therefore cannot stop the
ladder by doing nothing — only an explicit acknowledgement or resolution can.

**Failure semantics.** Each delivery is attempted independently through
`lib/notify.ts`. A delivery returns `sent`, `simulated`, or `failed`; it never
throws. One dead channel cannot abort the rest of the stage. Every attempt is
written to the incident's `deliveries` array with the exact number that was used,
so the audit trail reflects reality rather than intent.

**Access control.** Starting, advancing, acknowledging, or resolving an incident
requires the signed-in guardian who owns the senior. Queries never return another
family's incidents. The scheduled sweep runs as an internal action, outside user
authority, by design.

**Simulation, not deception.** When Twilio credentials or a voice webhook are not
configured, deliveries are recorded as `simulated` with a reason. The UI shows
that status; it never claims a message was sent when it was not.

## Vision AI prescription pipeline

`POST` flow:

1. The guardian uploads an image; the browser sends it to Convex file storage via
   a short-lived upload URL issued only to signed-in users.
2. `prescriptions.analyzePrescription` (Node action) checks auth, file size
   (≤ 8 MB), and MIME type, then base64-encodes the image.
3. The action calls the OpenAI-compatible endpoint with a strict JSON contract and
   one retry on transient failure; requests time out after 20 seconds.
4. The model response is treated as untrusted: JSON is extracted, parsed with Zod,
   medicine names are bounded, timings are normalised to 24-hour `HH:MM`, food
   relations are mapped to a fixed allowlist, and blank/invalid rows are dropped
   with warnings.
5. On missing credentials, provider error, unreadable file, or schema mismatch,
   the action returns `{ status: "fallback", reason }`. The UI then loads an
   editable template so onboarding is never blocked. The guardian must review
   every medicine before activation either way.

Required server environment variable: `OPENAI_API_KEY`. Optional:
`OPENAI_VISION_MODEL` (default `gpt-4o-mini`).

## Multilingual voice companion

`convex/lib/voice.ts` builds the spoken script from reviewed phrase templates for
Telugu, Hindi, Tamil, and English. It reads only stored prescription fields:
medicine, dose, food relation, colour/shape, and physical location. Languages
without a reviewed template explicitly fall back to English and report
`fallback: true`; the dashboard shows that label next to the script.

The agent's guardrails include: never change a dose, never double a missed dose,
and escalate chest pain or breathlessness immediately. The script exposes a keypad
confirmation prompt (`1` confirmed, `2` question), which is what feeds stage 1 of
the escalation engine.

To place real calls, configure Twilio credentials plus `TWILIO_VOICE_WEBHOOK_URL`
(a TwiML endpoint that renders the script in the senior's language). Without a
TwiML endpoint the code refuses to claim a call was placed.

## Smartwatch cloud sync

The senior record stores a per-senior vitals series (`hr`, `spo2`, `at`), a sleep
duration, a device brand, and `lastSyncedAt`. Every senior is seeded with a
baseline at enrolment so the dashboard and escalation thresholds have something
real to compare against. The intended production adapter is Google Health Connect
/ Apple HealthKit → a sync job → a Convex mutation that appends readings and calls
`escalations.start({ kind: "vitals" })` when `assessVitals()` flags a reading.

This repository does **not** ship a live consumer-health integration; see
"Known limitations".

## Security and privacy

- Every write checks `getAuthUserId` and ownership. Admin operations additionally
  require the `admin` role; the first full account on a deployment can claim it
  once, and guest sessions cannot.
- Medical payloads are validated and bounded server-side in
  `convex/lib/validation.ts`, including E.164 phone normalisation so an
  escalation cannot dial a malformed number.
- Comments are throttled to five per minute per user.
- Provider secrets are read from server environment variables only. The browser
  never receives an API key. No secret is logged.
- Delivery records store the number, channel, status and reference. Message bodies
  are kept to the minimum needed to explain the alert.
- Deleting an enrolment removes its escalation incidents to avoid orphaned medical
  history.
- Disclaimer: this is a care-coordination tool, not a medical device. It does not
  diagnose or change prescriptions, and it does not replace emergency services.

## Free-for-every-family model

There is no pricing field in the UI, no checkout, and no paid tier. The catalog's
programs are fixed to `price: 0` server-side, and the admin editor has no billing
inputs. Removing the ability to set a price is deliberate: the free promise is an
invariant of the system, not a marketing toggle.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | for Vision AI | Server-side vision parsing; fallback template otherwise |
| `OPENAI_VISION_MODEL` | optional | Defaults to `gpt-4o-mini` |
| `TWILIO_ACCOUNT_SID` | for live alerts | Twilio REST account |
| `TWILIO_AUTH_TOKEN` | for live alerts | Twilio REST token |
| `TWILIO_FROM_NUMBER` | for live SMS/voice | Sender number |
| `TWILIO_WHATSAPP_FROM` | for WhatsApp | WhatsApp-enabled sender |
| `TWILIO_VOICE_WEBHOOK_URL` | for live calls | TwiML endpoint that speaks the script |
| `AMBULANCE_DISPATCH_WEBHOOK_URL` | for Tier B | Partner dispatch endpoint |
| `AMBULANCE_DISPATCH_TOKEN` | optional | Bearer token for the dispatch endpoint |
| `VLY_INTEGRATION_KEY` | managed | Injected by the hosting platform |

Do not commit real values. Use the Keys/API keys panel in the host environment.

## Verification

```bash
bun install
bun convex dev --once          # push functions, regenerate types
bun tsc -b --noEmit            # typecheck
bun run verify                 # domain assertions (escalation, validation, voice)
bun run lint                   # eslint
```

`src/scripts/verify-core.ts` asserts the escalation ladder, phone/time
normalisation, medication validation, and multilingual script fallback behaviour.
It is a plain Bun script using `node:assert`, so it adds no test-framework
dependency.

## Known limitations

- No live consumer-health device integration; vitals are seeded and structured for
  an adapter, not streamed from a watch.
- No live conversational voice agent; the script builder, guardrails, and TwiML
  dispatch contract exist, but a voice provider must be configured.
- Vision AI requires `OPENAI_API_KEY`; otherwise the app uses the editable
  template and says so.
- Escalation delivery to real contacts requires Twilio or a dispatch webhook;
  without them every delivery is logged as simulated.
