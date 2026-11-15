import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  CONDITIONS,
  deriveSafetyFlags,
  FOOD_OPTIONS,
  formatPhone,
  formatTime12,
  LANGUAGES,
  profilePrescription,
  uid,
  type Medication,
} from "@/lib/care";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

type UploadedDocument = {
  name: string;
  kind: string;
  size: number;
  storageId?: Id<"_storage">;
  uploadedAt: number;
};

type Emergency = {
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

const STEPS = [
  { id: 1, label: "Senior details" },
  { id: 2, label: "Medical profile" },
  { id: 3, label: "Prescriptions" },
  { id: 4, label: "Emergency contacts" },
  { id: 5, label: "Review" },
] as const;

const STEP_COPY: Record<number, { title: string; hint: string }> = {
  1: {
    title: "Who are we calling?",
    hint: "The AI speaks to your parent on this phone number. They never type, tap, or open an app.",
  },
  2: {
    title: "Their medical profile",
    hint: "Conditions shape what the AI may safely say. Upload what you already have — we keep it with the profile.",
  },
  3: {
    title: "Prescription, made speakable",
    hint: "Upload a photo of the prescription. We read the medicines, timings and physical descriptions, then you approve every line.",
  },
  4: {
    title: "Who steps in, and when",
    hint: "Set the order of people we contact. The senior's home address is used for ambulance routing.",
  },
  5: {
    title: "One last look",
    hint: "Nothing is called or sent until you activate. Correct anything that looks off.",
  },
};

const fieldClass =
  "h-11 rounded-none border-0 border-b border-input bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:border-foreground focus-visible:ring-0";

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="label-eyebrow block">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createSenior = useMutation(api.seniors.create);
  const generateUploadUrl = useMutation(api.seniors.generateUploadUrl);

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "other">("female");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState<string>("Telugu");

  const [conditions, setConditions] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState("");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [rxSource, setRxSource] = useState<string | null>(null);
  const [rxState, setRxState] = useState<"idle" | "uploading" | "extracting">(
    "idle",
  );
  const rxInputRef = useRef<HTMLInputElement>(null);

  const [emergency, setEmergency] = useState<Emergency>({
    primaryName: "",
    primaryRelation: "Son",
    primaryPhone: "",
    secondaryName: "",
    secondaryRelation: "Neighbour",
    secondaryPhone: "",
    hospital: "",
    hospitalPhone: "",
    ambulance: "108",
    address: "",
  });

  // Prefill from the signed-in guardian, but never overwrite what they typed.
  const guardianName = emergency.primaryName || user?.name || "";

  const safetyFlags = deriveSafetyFlags(conditions, medications);
  const stepCopy = STEP_COPY[step];

  function toggleCondition(condition: string) {
    setConditions((current) =>
      current.includes(condition)
        ? current.filter((item) => item !== condition)
        : [...current, condition],
    );
  }

  function updateEmergency(patch: Partial<Emergency>) {
    setEmergency((current) => ({ ...current, ...patch }));
  }

  async function uploadToStorage(file: File) {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!response.ok) throw new Error("Upload failed. Please try again.");
    const json = (await response.json()) as { storageId: string };
    return json.storageId as Id<"_storage">;
  }

  async function handleDocumentFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadingDoc(true);
    setError(null);
    try {
      const uploaded: UploadedDocument[] = [];
      for (const file of Array.from(files)) {
        const storageId = await uploadToStorage(file);
        uploaded.push({
          name: file.name,
          kind: file.type || "file",
          size: file.size,
          storageId,
          uploadedAt: Date.now(),
        });
      }
      setDocuments((current) => [...current, ...uploaded]);
      toast.success(
        `${uploaded.length} document${uploaded.length > 1 ? "s" : ""} attached`,
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload that file.",
      );
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  }

  async function handlePrescriptionFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setRxSource(file.name);
    setRxState("uploading");
    try {
      // Keep the original in storage so a human can audit the extraction later.
      const storageId = await uploadToStorage(file);
      setDocuments((current) => [
        ...current,
        {
          name: file.name,
          kind: file.type || "image",
          size: file.size,
          storageId,
          uploadedAt: Date.now(),
        },
      ]);
      setRxState("extracting");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const parsed = profilePrescription(file.name);
      setMedications(parsed);
      toast.success("Prescription read — review each medicine below.");
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Could not read that prescription.",
      );
    } finally {
      setRxState("idle");
      if (rxInputRef.current) rxInputRef.current.value = "";
    }
  }

  function useSamplePrescription() {
    setRxSource("sample-prescription.jpg");
    setRxState("extracting");
    setError(null);
    setTimeout(() => {
      setMedications(profilePrescription("sample-prescription.jpg"));
      setRxState("idle");
      toast.success("Sample prescription read — try editing a field.");
    }, 1100);
  }

  function updateMedication(key: string, patch: Partial<Medication>) {
    setMedications((current) =>
      current.map((med) => (med.key === key ? { ...med, ...patch } : med)),
    );
  }

  function addMedication() {
    setMedications((current) => [
      ...current,
      {
        key: uid(),
        name: "",
        dosage: "",
        food: "After food",
        times: ["09:00"],
        appearance: "",
        location: "",
      },
    ]);
  }

  function removeMedication(key: string) {
    setMedications((current) => current.filter((med) => med.key !== key));
  }

  function updateMedicationTime(key: string, index: number, value: string) {
    setMedications((current) =>
      current.map((med) =>
        med.key === key
          ? {
              ...med,
              times: med.times.map((time, i) => (i === index ? value : time)),
            }
          : med,
      ),
    );
  }

  function validate() {
    if (step === 1) {
      if (!fullName.trim()) return "Add your parent's full name.";
      const ageNumber = Number(age);
      if (!age || Number.isNaN(ageNumber) || ageNumber < 40 || ageNumber > 120)
        return "Enter an age between 40 and 120.";
      if (phone.replace(/\D/g, "").length < 10)
        return "Enter the 10-digit phone number the AI should call.";
    }
    if (step === 3) {
      for (const med of medications) {
        if (!med.name.trim()) return "Every medicine needs a name.";
        if (!med.times.some(Boolean))
          return `Add a call time for ${med.name || "a medicine"}.`;
      }
    }
    if (step === 4) {
      if (!guardianName.trim())
        return "Add the primary guardian's name.";
      if (emergency.primaryPhone.replace(/\D/g, "").length < 10)
        return "Add the primary guardian's phone number.";
      if (emergency.secondaryPhone.replace(/\D/g, "").length < 10)
        return "Add a neighbour or local relative for Stage 3.";
      if (!emergency.address.trim())
        return "Add the home address so help can be routed there.";
    }
    return null;
  }

  function goNext() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleActivate() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    if (!fullName.trim()) {
      setError("Add your parent's full name.");
      setStep(1);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createSenior({
        fullName,
        age: Number(age),
        gender,
        phone,
        language,
        conditions,
        medicalNotes: medicalNotes || undefined,
        documents,
        medications,
        safetyFlags,
        emergency: { ...emergency, primaryName: guardianName },
      });
      toast.success(`Care plan for ${fullName.split(" ")[0]} is active`);
      navigate("/dashboard");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not activate the care plan. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Wordmark />
          <div className="flex items-center gap-6">
            <span className="hidden font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase sm:inline">
              Carecall · enrolment
            </span>
            <Link
              to="/catalog"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Programs
            </Link>
            <Link
              to="/dashboard"
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-12 md:grid-cols-[240px_1fr] md:gap-16">
          <aside className="md:sticky md:top-12 md:self-start">
            <p className="label-eyebrow">Enrolment</p>
            <h1 className="mt-4 font-display text-3xl leading-[1.15] tracking-tight">
              Five quiet minutes,
              <br />
              years of peace of mind.
            </h1>
            <ol className="mt-9 hidden md:block">
              {STEPS.map((item) => {
                const done = step > item.id;
                const active = step === item.id;
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-4 border-t border-border py-3.5"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] tabular-nums",
                        done &&
                          "border-foreground bg-foreground text-background",
                        active && "border-foreground text-foreground",
                        !done && !active && "border-border text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="size-3" /> : `0${item.id}`}
                    </span>
                    <span
                      className={cn(
                        "text-sm leading-5",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-8 hidden max-w-[200px] text-xs leading-5 text-muted-foreground md:block">
              Your parent never sees this screen. They only receive a phone call
              in their own language.
            </p>
          </aside>

          <section className="min-w-0 md:border-l md:border-border md:pl-12">
            <div className="flex items-baseline justify-between gap-4">
              <p className="label-eyebrow">
                Step {String(step).padStart(2, "0")} / 05
              </p>
              <p className="text-xs text-muted-foreground">
                {STEPS[step - 1].label}
              </p>
            </div>
            <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-[2.75rem]">
              {stepCopy.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {stepCopy.hint}
            </p>

            <div className="mt-10">
              {step === 1 && (
                <div className="grid gap-8 sm:grid-cols-2">
                  <Field label="Full name" className="sm:col-span-2">
                    <Input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Lakshmi Devi"
                      className={fieldClass}
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Age">
                    <Input
                      value={age}
                      onChange={(event) =>
                        setAge(event.target.value.replace(/\D/g, "").slice(0, 3))
                      }
                      inputMode="numeric"
                      placeholder="74"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Gender">
                    <div className="flex gap-2 pt-1">
                      {(["female", "male", "other"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setGender(option)}
                          className={cn(
                            "h-9 flex-1 rounded-full border px-3 text-xs capitalize transition-colors",
                            gender === option
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field
                    label="Primary phone number"
                    hint="This is the number the AI will dial. A landline works too."
                  >
                    <Input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="98765 43210"
                      inputMode="tel"
                      className={fieldClass}
                      autoComplete="off"
                    />
                  </Field>
                  <Field
                    label="Preferred mother tongue"
                    hint="Calls, questions and pill guidance all happen in this language."
                  >
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-11 w-full rounded-none border-0 border-b border-input px-0 shadow-none focus-visible:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="sm:col-span-2 border-t border-border pt-6">
                    <p className="flex items-start gap-3 text-xs leading-5 text-muted-foreground">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--chart-1)]" />
                      Check the number carefully. Two wrong digits mean a call
                      that never reaches them.
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10">
                  <div>
                    <p className="label-eyebrow">Chronic conditions</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Select everything that applies. This sets the guardrails
                      on every call.
                    </p>
                    <div className="mt-5 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
                      {CONDITIONS.map((condition) => {
                        const checked = conditions.includes(condition);
                        return (
                          <label
                            key={condition}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 bg-background px-4 py-3.5 text-sm transition-colors",
                              checked
                                ? "bg-secondary text-foreground"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleCondition(condition)}
                            />
                            {condition}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <Field
                    label="Anything else the AI should know"
                    hint="Allergies, recent falls, a recent surgery — plain language is fine."
                  >
                    <Textarea
                      value={medicalNotes}
                      onChange={(event) => setMedicalNotes(event.target.value)}
                      placeholder="Mild allergy to penicillin. Had a knee replacement in March."
                      className="min-h-24 rounded-none border-border shadow-none focus-visible:border-foreground focus-visible:ring-0"
                    />
                  </Field>

                  <div>
                    <p className="label-eyebrow">Medical records</p>
                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        void handleDocumentFiles(event.dataTransfer.files);
                      }}
                      className="mt-3 border border-dashed border-border px-6 py-8 text-center transition-colors hover:border-foreground/40"
                    >
                      <input
                        ref={docInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx"
                        className="hidden"
                        onChange={(event) =>
                          void handleDocumentFiles(event.target.files)
                        }
                      />
                      <Upload className="mx-auto size-5 text-muted-foreground" />
                      <p className="mt-3 text-sm">
                        Drop bills, discharge summaries or doctor's notes
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF, JPG or PNG · up to 10 MB each
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingDoc}
                        onClick={() => docInputRef.current?.click()}
                        className="mt-4 rounded-full"
                      >
                        {uploadingDoc ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Uploading
                          </>
                        ) : (
                          "Choose files"
                        )}
                      </Button>
                    </div>

                    {documents.length > 0 && (
                      <ul className="mt-4">
                        {documents.map((doc) => (
                          <li
                            key={`${doc.name}-${doc.uploadedAt}`}
                            className="flex items-center justify-between gap-4 border-t border-border py-3 first:border-t-0"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <FileText className="size-4 shrink-0 text-muted-foreground" />
                              <span className="truncate text-sm">
                                {doc.name}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {(doc.size / 1024).toFixed(0)} KB
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setDocuments((current) =>
                                  current.filter(
                                    (item) =>
                                      !(
                                        item.name === doc.name &&
                                        item.uploadedAt === doc.uploadedAt
                                      ),
                                  ),
                                )
                              }
                              className="text-muted-foreground transition-colors hover:text-foreground"
                              aria-label={`Remove ${doc.name}`}
                            >
                              <X className="size-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-10">
                  <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-[1.1fr_1fr]">
                    <div className="bg-background p-6">
                      <div className="flex items-center gap-2 text-[var(--chart-1)]">
                        <Sparkles className="size-3.5" />
                        <span className="text-[10px] tracking-[0.18em] uppercase">
                          Vision AI
                        </span>
                      </div>
                      <p className="mt-4 font-display text-2xl leading-snug">
                        {rxState === "extracting"
                          ? "Reading dosage, timing and packaging…"
                          : rxState === "uploading"
                            ? "Uploading the prescription…"
                            : rxSource
                              ? "Prescription read. Check every line."
                              : "Start with a photo of the prescription slip."}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Nothing starts until you approve the parsed medicines.
                      </p>
                      <input
                        ref={rxInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(event) =>
                          void handlePrescriptionFile(event.target.files?.[0])
                        }
                      />
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          size="sm"
                          disabled={rxState !== "idle"}
                          onClick={() => rxInputRef.current?.click()}
                          className="rounded-full"
                        >
                          {rxState !== "idle" ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                          Upload photo
                        </Button>
                        <button
                          type="button"
                          onClick={useSamplePrescription}
                          disabled={rxState !== "idle"}
                          className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground disabled:opacity-50"
                        >
                          Try a sample prescription
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border bg-secondary/40 p-6 sm:border-t-0 sm:border-l">
                      <p className="label-eyebrow">What gets extracted</p>
                      <ul className="mt-4 space-y-2.5 text-xs leading-5 text-muted-foreground">
                        <li>· Medicine name and strength</li>
                        <li>· Exact dose timings, split into calls</li>
                        <li>· Before or after food</li>
                        <li>· Colour, shape and where it is kept</li>
                        <li>· Dietary conflicts with the medical profile</li>
                      </ul>
                      <p className="mt-4 border-t border-border pt-4 text-[11px] leading-5 text-muted-foreground">
                        Always check against the paper slip. The AI only reads
                        what you approve.
                      </p>
                    </div>
                  </div>

                  {medications.length > 0 && (
                    <div>
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="label-eyebrow">
                          Medicines · {medications.length}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          Editable
                        </span>
                      </div>
                      <div className="mt-3 border-t border-border">
                        {medications.map((med, index) => (
                          <div
                            key={med.key}
                            className="border-b border-border py-6"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs tabular-nums text-muted-foreground">
                                Medicine {String(index + 1).padStart(2, "0")}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeMedication(med.key)}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label={`Remove ${med.name || "medicine"}`}
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                            <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                              <Field label="Medicine">
                                <Input
                                  value={med.name}
                                  onChange={(event) =>
                                    updateMedication(med.key, {
                                      name: event.target.value,
                                    })
                                  }
                                  placeholder="Metformin"
                                  className={fieldClass}
                                />
                              </Field>
                              <Field label="Dosage">
                                <Input
                                  value={med.dosage}
                                  onChange={(event) =>
                                    updateMedication(med.key, {
                                      dosage: event.target.value,
                                    })
                                  }
                                  placeholder="500 mg"
                                  className={fieldClass}
                                />
                              </Field>
                              <Field label="Call times">
                                <div className="flex items-center gap-3">
                                  {med.times.map((time, timeIndex) => (
                                    <input
                                      key={timeIndex}
                                      type="time"
                                      value={time}
                                      onChange={(event) =>
                                        updateMedicationTime(
                                          med.key,
                                          timeIndex,
                                          event.target.value,
                                        )
                                      }
                                      className="h-11 min-w-0 flex-1 border-b border-input bg-transparent text-sm tabular-nums outline-none focus:border-foreground"
                                    />
                                  ))}
                                  {med.times.length < 3 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateMedication(med.key, {
                                          times: [...med.times, "13:00"],
                                        })
                                      }
                                      className="text-muted-foreground transition-colors hover:text-foreground"
                                      aria-label="Add another dose time"
                                    >
                                      <Plus className="size-4" />
                                    </button>
                                  )}
                                </div>
                              </Field>
                              <Field label="Food relation">
                                <Select
                                  value={med.food}
                                  onValueChange={(value) =>
                                    updateMedication(med.key, { food: value })
                                  }
                                >
                                  <SelectTrigger className="h-11 w-full rounded-none border-0 border-b border-input px-0 shadow-none focus-visible:ring-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FOOD_OPTIONS.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>
                              <Field label="What it looks like">
                                <Input
                                  value={med.appearance}
                                  onChange={(event) =>
                                    updateMedication(med.key, {
                                      appearance: event.target.value,
                                    })
                                  }
                                  placeholder="White, oval tablet"
                                  className={fieldClass}
                                />
                              </Field>
                              <Field label="Where it is kept">
                                <Input
                                  value={med.location}
                                  onChange={(event) =>
                                    updateMedication(med.key, {
                                      location: event.target.value,
                                    })
                                  }
                                  placeholder="Red box on the kitchen table"
                                  className={fieldClass}
                                />
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={addMedication}
                        className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        <Plus className="size-3.5" />
                        Add a medicine manually
                      </button>
                    </div>
                  )}

                  {medications.length === 0 && (
                    <button
                      type="button"
                      onClick={addMedication}
                      className="inline-flex items-center gap-2 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                      <Plus className="size-3.5" />
                      Enter medicines manually instead
                    </button>
                  )}

                  <div className="border-t border-border pt-6">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-[var(--chart-1)]" />
                      <p className="label-eyebrow text-foreground">
                        Safety guardrails applied automatically
                      </p>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {safetyFlags.map((flag) => (
                        <li
                          key={flag}
                          className="flex items-start gap-3 text-xs leading-5 text-muted-foreground"
                        >
                          <span
                            className="mt-1.5 size-1 shrink-0 rounded-full bg-foreground/50"
                            aria-hidden
                          />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10">
                  <div>
                    <p className="label-eyebrow">Stage 2 · primary guardian</p>
                    <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-3">
                      <Field label="Name">
                        <Input
                          value={guardianName}
                          onChange={(event) =>
                            updateEmergency({ primaryName: event.target.value })
                          }
                          placeholder="Your name"
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Relationship">
                        <Input
                          value={emergency.primaryRelation}
                          onChange={(event) =>
                            updateEmergency({
                              primaryRelation: event.target.value,
                            })
                          }
                          placeholder="Son"
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Phone">
                        <Input
                          value={emergency.primaryPhone}
                          onChange={(event) =>
                            updateEmergency({ primaryPhone: event.target.value })
                          }
                          placeholder="98765 43210"
                          inputMode="tel"
                          className={fieldClass}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <p className="label-eyebrow">
                      Stage 3 · tier A, local contact
                    </p>
                    <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-3">
                      <Field label="Name">
                        <Input
                          value={emergency.secondaryName}
                          onChange={(event) =>
                            updateEmergency({ secondaryName: event.target.value })
                          }
                          placeholder="Sunita, next door"
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Relationship">
                        <Input
                          value={emergency.secondaryRelation}
                          onChange={(event) =>
                            updateEmergency({
                              secondaryRelation: event.target.value,
                            })
                          }
                          placeholder="Neighbour"
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Phone">
                        <Input
                          value={emergency.secondaryPhone}
                          onChange={(event) =>
                            updateEmergency({
                              secondaryPhone: event.target.value,
                            })
                          }
                          placeholder="98765 43210"
                          inputMode="tel"
                          className={fieldClass}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <p className="label-eyebrow">
                      Stage 3 · tier B, local help
                    </p>
                    <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                      <Field
                        label="Preferred hospital"
                        hint="The nearest facility with a working emergency desk."
                      >
                        <Input
                          value={emergency.hospital}
                          onChange={(event) =>
                            updateEmergency({ hospital: event.target.value })
                          }
                          placeholder="KIMS, Secunderabad"
                          className={fieldClass}
                        />
                      </Field>
                      <Field label="Hospital phone">
                        <Input
                          value={emergency.hospitalPhone}
                          onChange={(event) =>
                            updateEmergency({ hospitalPhone: event.target.value })
                          }
                          placeholder="040 1234 5678"
                          inputMode="tel"
                          className={fieldClass}
                        />
                      </Field>
                      <Field
                        label="Ambulance number"
                        hint="Defaults to the national emergency line."
                      >
                        <Input
                          value={emergency.ambulance}
                          onChange={(event) =>
                            updateEmergency({ ambulance: event.target.value })
                          }
                          placeholder="108"
                          inputMode="tel"
                          className={fieldClass}
                        />
                      </Field>
                      <Field
                        label="Home address"
                        className="sm:col-span-2"
                        hint="Read out to the ambulance desk — include a landmark."
                      >
                        <Input
                          value={emergency.address}
                          onChange={(event) =>
                            updateEmergency({ address: event.target.value })
                          }
                          placeholder="Flat 2B, Sai Residency, Lane 4, Ameerpet, Hyderabad"
                          className={fieldClass}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <p className="text-xs leading-5 text-muted-foreground">
                      Alerts follow this order: the senior's phone first, then
                      you, then the neighbour, then the ambulance desk. No stage
                      is skipped.
                    </p>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <div className="border-t border-border">
                    <ReviewRow
                      label="Senior"
                      onEdit={() => setStep(1)}
                      value={`${fullName || "—"}${age ? `, ${age}` : ""} · ${gender}`}
                    />
                    <ReviewRow
                      label="Phone"
                      onEdit={() => setStep(1)}
                      value={formatPhone(phone) || "—"}
                    />
                    <ReviewRow
                      label="Call language"
                      onEdit={() => setStep(1)}
                      value={language}
                    />
                    <ReviewRow
                      label="Conditions"
                      onEdit={() => setStep(2)}
                      value={
                        conditions.length ? conditions.join(", ") : "None recorded"
                      }
                    />
                    <ReviewRow
                      label="Records"
                      onEdit={() => setStep(2)}
                      value={
                        documents.length
                          ? `${documents.length} document${documents.length > 1 ? "s" : ""} attached`
                          : "No documents attached"
                      }
                    />
                    <ReviewRow
                      label="Medicines"
                      onEdit={() => setStep(3)}
                      value={
                        medications.length
                          ? medications
                              .map(
                                (med) =>
                                  `${med.name || "Unnamed"} ${med.dosage} at ${med.times
                                    .filter(Boolean)
                                    .map(formatTime12)
                                    .join(" & ")}`,
                              )
                              .join(" · ")
                          : "No medicines yet"
                      }
                    />
                    <ReviewRow
                      label="Guardian"
                      onEdit={() => setStep(4)}
                      value={`${guardianName || "—"} (${emergency.primaryRelation || "—"}) · ${formatPhone(emergency.primaryPhone) || "—"}`}
                    />
                    <ReviewRow
                      label="Local contact"
                      onEdit={() => setStep(4)}
                      value={`${emergency.secondaryName || "—"} · ${formatPhone(emergency.secondaryPhone) || "—"}`}
                    />
                    <ReviewRow
                      label="Emergency routing"
                      onEdit={() => setStep(4)}
                      value={`${emergency.hospital || "No hospital set"} · ambulance ${emergency.ambulance || "—"}`}
                    />
                  </div>

                  <div className="mt-10 space-y-4 border border-border p-6">
                    <p className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="size-4 text-[var(--chart-1)]" />
                      What happens the moment you activate
                    </p>
                    <ul className="space-y-2 text-xs leading-5 text-muted-foreground">
                      <li>
                        · The AI learns your parent's name, language and pill
                        descriptions.
                      </li>
                      <li>
                        · The first call is placed at the earliest dose time
                        {medications.length
                          ? ` (${formatTime12(
                              [...medications]
                                .flatMap((med) => med.times)
                                .filter(Boolean)
                                .sort()[0] ?? "",
                            )})`
                          : ""}
                        .
                      </li>
                      <li>
                        · Your guardian number receives the call summary after
                        every dose, taken or missed.
                      </li>
                    </ul>
                  </div>

                  {error && (
                    <p className="mt-4 text-xs text-destructive">{error}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between gap-6 border-t border-border pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={step === 1 || submitting}
                className="rounded-full px-0 text-muted-foreground hover:bg-transparent hover:text-foreground disabled:opacity-30"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>

              <div className="flex items-center gap-4">
                {error && step !== 5 && (
                  <p className="max-w-[240px] text-right text-xs leading-5 text-destructive">
                    {error}
                  </p>
                )}
                {step < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    className="rounded-full px-6"
                  >
                    Continue
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void handleActivate()}
                    disabled={submitting}
                    className="rounded-full px-6"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Activating
                      </>
                    ) : (
                      <>
                        Activate care plan
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border py-4">
      <div className="min-w-0">
        <p className="label-eyebrow">{label}</p>
        <p className="mt-1.5 text-sm leading-6 break-words">{value}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Edit
      </button>
    </div>
  );
}
