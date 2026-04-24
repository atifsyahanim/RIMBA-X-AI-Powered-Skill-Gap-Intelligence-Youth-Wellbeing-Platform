"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Loader2,
  Download,
  Plus,
  Sparkles,
  History,
  Wand2,
} from "lucide-react";
import { ResumePreview } from "@/components/career/ResumePreview";
import { ATSScoreGauge } from "@/components/career/ATSScoreGauge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ResumeVersion } from "@/types";
import toast from "react-hot-toast";

const TONES = ["professional", "friendly", "technical", "creative"] as const;
type Tone = (typeof TONES)[number];

const TONE_DESC: Record<Tone, string> = {
  professional: "Formal & corporate",
  friendly: "Warm & approachable",
  technical: "Detail-oriented",
  creative: "Bold & original",
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

export default function CareerResumePage() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [active, setActive] = useState<ResumeVersion | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [targetRole, setTargetRole] = useState("");
  const [versionName, setVersionName] = useState("");
  const [tone, setTone] = useState<Tone>("professional");

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/career/resume")
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: { resumes?: ResumeVersion[] } | ResumeVersion[]) => {
        const data: ResumeVersion[] = Array.isArray(json)
          ? json
          : (json.resumes ?? []);
        setVersions(data);
        if (data.length > 0) setActive(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    if (!targetRole.trim()) {
      toast.error("Enter a target role first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/career/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: targetRole,
          tone,
          version_name:
            versionName ||
            `${targetRole} (${new Date().toLocaleDateString("en-MY")})`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Generation failed.");
        return;
      }
      const json = await res.json();
      const newVersion: ResumeVersion = json.resume ?? json.data;
      setVersions((prev) => [newVersion, ...prev]);
      setActive(newVersion);
      toast.success("Resume generated! +100 XP");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function exportPDF() {
    const el = document.getElementById("resume-preview");
    if (!el) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${active?.version_name ?? "resume"}.pdf`);
      toast.success("PDF exported!");
    } catch {
      toast.error("Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* HERO */}
      <div className="relative overflow-hidden bg-rose-500 mx-6 mt-6 rounded-2xl px-6 py-8">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, white 0, white 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, white 0, white 1px, transparent 1px, transparent 28px)",
          }}
        />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10"
        >
          <motion.div
            variants={fadeUp}
            suppressHydrationWarning
            className="flex items-center gap-2 mb-3"
          >
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <span className="text-white/80 text-sm font-semibold">
              Resume Builder
            </span>
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
              <Sparkles size={9} /> ATS-Optimised
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            suppressHydrationWarning
            className="text-3xl md:text-4xl font-extrabold text-white mb-2"
          >
            AI Resume Builder
          </motion.h1>
          <motion.p
            variants={fadeUp}
            suppressHydrationWarning
            className="text-rose-100 text-sm"
          >
            Generate a role-specific, ATS-optimised resume in seconds — powered
            by Gemini AI
          </motion.p>
        </motion.div>
      </div>

      <div className="px-6 md:px-8 pt-5 pb-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* ── LEFT: Generator + History ── */}
          <motion.div
            variants={fadeUp}
            suppressHydrationWarning
            className="lg:col-span-3 flex flex-col gap-4"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                  <Wand2 size={15} className="text-rose-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">
                  Generate Resume
                </h3>
              </div>

              <Input
                label="Target Role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Data Analyst"
              />
              <Input
                label="Version Name (optional)"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g. FAANG Application"
              />

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                  Tone
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border capitalize transition-all text-left
                        ${
                          tone === t
                            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-sm"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300"
                        }`}
                    >
                      <span className="block">{t}</span>
                      <span
                        className={`text-[9px] font-normal ${tone === t ? "text-white/70" : "text-gray-400"}`}
                      >
                        {TONE_DESC[t]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-bold py-3 rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Plus size={15} /> Generate Resume
                  </>
                )}
              </button>
            </div>

            {versions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <History size={13} className="text-gray-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    History
                  </h3>
                </div>
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActive(v)}
                      className={`text-left p-2.5 rounded-xl border transition-all
                        ${
                          active?.id === v.id
                            ? "border-rose-300 bg-rose-50 shadow-sm"
                            : "border-gray-100 hover:border-rose-200 hover:bg-rose-50/40"
                        }`}
                    >
                      <p className="font-bold text-xs text-gray-900 truncate">
                        {v.version_name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {v.target_role} · ATS {v.ats_score ?? "—"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── CENTRE: Preview ── */}
          <motion.div
            variants={fadeUp}
            suppressHydrationWarning
            className="lg:col-span-6"
            ref={previewRef}
          >
            {loading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 h-96 animate-pulse" />
            )}
            {!loading && !active && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-12 flex flex-col items-center justify-center min-h-64 gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <FileText size={28} className="text-gray-200" />
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Generate a resume to see the preview here
                </p>
              </div>
            )}
            {active && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                suppressHydrationWarning
                className="shadow-2xl rounded-2xl overflow-hidden"
              >
                <ResumePreview resume={active} />
              </motion.div>
            )}
          </motion.div>

          {/* ── RIGHT: ATS + Tips ── */}
          <motion.div
            variants={fadeUp}
            suppressHydrationWarning
            className="lg:col-span-3 flex flex-col gap-4"
          >
            {active ? (
              <>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col items-center gap-4">
                  <ATSScoreGauge score={active.ats_score ?? 0} />
                  <Button
                    variant="outline"
                    onClick={exportPDF}
                    disabled={exporting}
                    className="w-full"
                  >
                    {exporting ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-2" />{" "}
                        Exporting…
                      </>
                    ) : (
                      <>
                        <Download size={14} className="mr-2" /> Export PDF
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Tips to Boost ATS Score
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {[
                      "Mirror keywords from the job posting",
                      "Quantify achievements with numbers",
                      "Keep formatting clean — no tables",
                      "Include role-matching skills",
                      "Use standard section headings",
                    ].map((tip, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-500 flex items-start gap-2"
                      >
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  ATS Score
                </p>
                <p className="text-sm text-gray-400">
                  Generate a resume to see your ATS compatibility score
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
