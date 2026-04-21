"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Briefcase,
  Target,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SkillTagInput } from "./SkillTagInput";
import toast from "react-hot-toast";

const LEVELS = [
  "SPM",
  "Diploma",
  "Bachelor",
  "Master",
  "PhD",
  "Professional",
] as const;
const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Government",
  "E-Commerce",
  "Consulting",
  "Media",
  "Other",
];

interface WorkExp {
  company: string;
  role: string;
  duration_months: number;
}

interface FormState {
  // Step 1
  full_name: string;
  current_level: string;
  field_of_study: string;
  institution: string;
  graduation_year: string;
  // Step 2
  current_skills: string[];
  work_experience: WorkExp[];
  certifications: string[];
  // Step 3
  target_career: string;
  target_industry: string;
  career_goals: string;
  location: string;
}

const INITIAL: FormState = {
  full_name: "",
  current_level: "",
  field_of_study: "",
  institution: "",
  graduation_year: "",
  current_skills: [],
  work_experience: [],
  certifications: [],
  target_career: "",
  target_industry: "",
  career_goals: "",
  location: "",
};

const STEPS = [
  { icon: User, label: "Background" },
  { icon: Briefcase, label: "Skills" },
  { icon: Target, label: "Goals" },
];

interface CareerProfileFormProps {
  initialData?: Partial<FormState>;
  onSuccess?: () => void;
}

export function CareerProfileForm({
  initialData,
  onSuccess,
}: CareerProfileFormProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ ...INITIAL, ...initialData });
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addWorkExp() {
    set("work_experience", [
      ...form.work_experience,
      { company: "", role: "", duration_months: 0 },
    ]);
  }

  function removeWorkExp(idx: number) {
    set(
      "work_experience",
      form.work_experience.filter((_, i) => i !== idx),
    );
  }

  function updateWorkExp(
    idx: number,
    field: keyof WorkExp,
    value: string | number,
  ) {
    const updated = form.work_experience.map((exp, i) =>
      i === idx ? { ...exp, [field]: value } : exp,
    );
    set("work_experience", updated);
  }

  function canAdvance() {
    if (step === 0)
      return (
        form.full_name.trim() &&
        form.current_level &&
        form.field_of_study.trim()
      );
    if (step === 1) return form.current_skills.length > 0;
    return form.target_career.trim() && form.target_industry;
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    setParsing(true);
    const id = toast.loading("Reading resume...");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = reader.result?.toString().split(",")[1];
        if (!base64) {
          toast.error("Failed to read file.");
          setParsing(false);
          toast.dismiss(id);
          return;
        }

        try {
          const res = await fetch("/api/career/parse-resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: base64, mimeType: "application/pdf" }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Failed to parse file");

          if (json.data) {
            setForm((prev) => ({
              ...prev,
              full_name: json.data.full_name || prev.full_name,
              current_level: json.data.current_level || prev.current_level,
              field_of_study: json.data.field_of_study || prev.field_of_study,
              institution: json.data.institution || prev.institution,
              current_skills: json.data.current_skills || prev.current_skills,
              work_experience:
                json.data.work_experience || prev.work_experience,
            }));
            toast.success("Resume parsed & forms populated! ✨");
          }
        } catch (e: any) {
          toast.error(e.message || "Could not parse resume.");
        } finally {
          setParsing(false);
          toast.dismiss(id);
        }
      };
    } catch (e: any) {
      toast.error("Failed to process file.");
      setParsing(false);
      toast.dismiss(id);
    }
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/career/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          graduation_year: form.graduation_year
            ? Number(form.graduation_year)
            : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      toast.success("Career profile saved! +50 XP");
      onSuccess?.();
    } catch {
      toast.error("Could not save profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Step indicator */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${
                    active
                      ? "bg-primary text-white shadow-md"
                      : done
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? "✓" : <Icon size={14} />}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${active ? "text-primary" : done ? "text-green-600" : "text-gray-400"}`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-px mx-1 ${i < step ? "bg-green-400" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-4"
          >
            {/* STEP 0 */}
            {step === 0 && (
              <>
                <div className="border border-gray-100 bg-white rounded-2xl p-8 mb-4 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all">
                  {/* Circle Icon */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-full bg-violet-50/80 flex items-center justify-center mb-4 cursor-pointer hover:bg-violet-100/80 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={32} className="text-[#8B5CF6]" />
                  </motion.div>

                  {/* Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf"
                    className="hidden"
                  />

                  <h3 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
                    Upload your Resume
                  </h3>
                  <p className="text-sm text-gray-400 max-w-xs leading-snug font-medium">
                    Drag & drop your PDF, DOC, or DOCX file here.
                  </p>
                  <p className="text-sm text-gray-400 mb-6 font-medium">
                    Max size 2MB.
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    className="bg-[#8B5CF6] hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-200/30 text-white font-bold text-sm px-6 py-2.5 rounded-2xl shadow-md transition-all mb-4 px-8 min-w-[140px]"
                  >
                    {parsing ? "Reading..." : "Select File"}
                  </button>

                  <p className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 justify-center">
                    <span className="opacity-70">🛡️</span> Private & Secure
                    Analysis
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 mt-2 mb-3">
                  <h2 className="text-sm font-bold text-gray-800">
                    Or Update Manually
                  </h2>
                  <p className="text-[10px] text-gray-400">
                    Add your background details step-by-step.
                  </p>
                </div>
                <Input
                  label="Full Name"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="e.g. Ahmad Faris"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Education Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => set("current_level", l)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                          ${
                            form.current_level === l
                              ? "bg-primary text-white border-primary"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                          }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  label="Field of Study"
                  value={form.field_of_study}
                  onChange={(e) => set("field_of_study", e.target.value)}
                  placeholder="e.g. Computer Science"
                />
                <Input
                  label="Institution"
                  value={form.institution}
                  onChange={(e) => set("institution", e.target.value)}
                  placeholder="e.g. UTM Johor Bahru"
                />
                <Input
                  label="Graduation Year"
                  type="number"
                  min={1990}
                  max={2035}
                  value={form.graduation_year}
                  onChange={(e) => set("graduation_year", e.target.value)}
                  placeholder="e.g. 2025"
                />
              </>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Skills & Experience
                  </h2>
                  <p className="text-sm text-gray-500">
                    What can you do right now?
                  </p>
                </div>
                <SkillTagInput
                  label="Current Skills"
                  value={form.current_skills}
                  onChange={(v) => set("current_skills", v)}
                  placeholder="Type a skill and press Enter"
                />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Work Experience
                    </label>
                    <button
                      type="button"
                      onClick={addWorkExp}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {form.work_experience.map((exp, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2"
                      >
                        <Input
                          placeholder="Company name"
                          value={exp.company}
                          onChange={(e) =>
                            updateWorkExp(i, "company", e.target.value)
                          }
                        />
                        <Input
                          placeholder="Role / Title"
                          value={exp.role}
                          onChange={(e) =>
                            updateWorkExp(i, "role", e.target.value)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            placeholder="Months"
                            value={exp.duration_months || ""}
                            onChange={(e) =>
                              updateWorkExp(
                                i,
                                "duration_months",
                                Number(e.target.value),
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeWorkExp(i)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {form.work_experience.length === 0 && (
                      <p className="text-xs text-gray-400 italic text-center py-2">
                        No work experience yet &mdash; that&apos;s okay!
                      </p>
                    )}
                  </div>
                </div>
                <SkillTagInput
                  label="Certifications (optional)"
                  value={form.certifications}
                  onChange={(v) => set("certifications", v)}
                  placeholder="e.g. AWS Cloud Practitioner"
                />
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Your Career Goals
                  </h2>
                  <p className="text-sm text-gray-500">
                    Where do you want to go?
                  </p>
                </div>
                <Input
                  label="Target Career"
                  value={form.target_career}
                  onChange={(e) => set("target_career", e.target.value)}
                  placeholder="e.g. Data Analyst"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Target Industry
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => set("target_industry", ind)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                          ${
                            form.target_industry === ind
                              ? "bg-primary text-white border-primary"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                          }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Career Goals
                  </label>
                  <textarea
                    rows={3}
                    value={form.career_goals}
                    onChange={(e) => set("career_goals", e.target.value)}
                    placeholder="Describe what you want to achieve in your career..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <Input
                  label="Preferred Location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Kuala Lumpur"
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft size={14} className="mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
          >
            Next <ChevronRight size={14} className="ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canAdvance() || saving}>
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" /> Saving…
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
