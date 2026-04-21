"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart2,
  RefreshCw,
  Loader2,
  AlertCircle,
  Zap,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Compass,
  BookOpen,
  Bot,
  Layers,
  Users,
  ExternalLink,
  Clock,
  Lock,
} from "lucide-react";
import { SkillMatchScore } from "@/components/career/SkillMatchScore";
import { SkillGapCard } from "@/components/career/SkillGapCard";
import { Button } from "@/components/ui/Button";
import type { SkillGapAnalysis, SkillGap } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ── Roadmap types & helpers ──────────────────────────────────────
interface RoadmapPhase {
  weekLabel: string;
  skill: SkillGap;
  phase: number;
}

const PHASE_PALETTES = [
  {
    bg: "from-violet-500 to-purple-600",
    bar: "from-violet-400 to-purple-500",
    soft: "bg-violet-50 text-violet-700 border-violet-200",
    glow: "shadow-violet-300/60",
    num: "text-violet-500",
  },
  {
    bg: "from-rose-500 to-pink-600",
    bar: "from-rose-400 to-pink-500",
    soft: "bg-rose-50 text-rose-700 border-rose-200",
    glow: "shadow-rose-300/60",
    num: "text-rose-500",
  },
  {
    bg: "from-amber-500 to-orange-600",
    bar: "from-amber-400 to-orange-500",
    soft: "bg-amber-50 text-amber-700 border-amber-200",
    glow: "shadow-amber-300/60",
    num: "text-amber-500",
  },
  {
    bg: "from-emerald-500 to-teal-600",
    bar: "from-emerald-400 to-teal-500",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-200",
    glow: "shadow-emerald-300/60",
    num: "text-emerald-500",
  },
  {
    bg: "from-sky-500 to-blue-600",
    bar: "from-sky-400 to-blue-500",
    soft: "bg-sky-50 text-sky-700 border-sky-200",
    glow: "shadow-sky-300/60",
    num: "text-sky-500",
  },
];

function getPalette(index: number) {
  return PHASE_PALETTES[index % PHASE_PALETTES.length];
}

const URGENCY_LABELS: Record<string, { label: string; icon: string }> = {
  critical: { label: "Mission Critical", icon: "🔥" },
  important: { label: "High Impact", icon: "⚡" },
  nice: { label: "Good to Have", icon: "✨" },
};

function getCategoryIcon(category: string, size = 14) {
  const lower = category.toLowerCase();
  if (
    lower.includes("architect") ||
    lower.includes("system") ||
    lower.includes("infra") ||
    lower.includes("platform")
  )
    return <Layers size={size} />;
  if (
    lower.includes("manage") ||
    lower.includes("team") ||
    lower.includes("leader") ||
    lower.includes("people")
  )
    return <Users size={size} />;
  if (
    lower.includes("data") ||
    lower.includes("analyt") ||
    lower.includes("learn") ||
    lower.includes("research")
  )
    return <BookOpen size={size} />;
  return <Zap size={size} />;
}

function getLevelPct(importance: string) {
  if (importance === "critical") return 28;
  if (importance === "important") return 55;
  return 75;
}

function getAiFirstSentence(summary: string) {
  const clean = summary
    .replace(/\*\*/g, "")
    .replace(/[#*_`]/g, "")
    .replace(/[🔍⚠️🎯]/gu, "");
  const sentences = clean
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  return sentences[0] ? sentences[0] + "." : clean.slice(0, 200);
}

// ── ReadinessProgressBar ─────────────────────────────────────────
interface ReadinessProgressBarProps {
  current: number;
  target: number;
  weeks: number;
}

function ReadinessProgressBar({
  current,
  target,
  weeks,
}: ReadinessProgressBarProps) {
  const gain = target - current;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm p-6 mb-8">
      {/* Decorative blurred orbs */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-violet-200 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange-200 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="relative z-10">
        {/* Title row */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Your Readiness Journey
            </p>
            <p className="text-sm text-gray-600">
              Complete all phases to unlock{" "}
              <span className="font-bold text-violet-600">{target}%</span>{" "}
              readiness
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2">
              <div className="text-xl font-black text-orange-500">
                {current}%
              </div>
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                Now
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <ArrowRight size={18} className="text-gray-300" />
              <span className="text-[9px] text-gray-300 font-bold">
                +{gain}%
              </span>
            </div>
            <div className="text-center bg-violet-50 border border-violet-100 rounded-2xl px-4 py-2">
              <div className="text-xl font-black text-violet-600">
                {target}%
              </div>
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                Goal
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
              <Clock size={13} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-700">{weeks}w</span>
            </div>
          </div>
        </div>

        {/* Segmented bar — each segment = 1 week */}
        <div className="flex gap-1 h-3">
          {Array.from({ length: weeks }).map((_, i) => {
            const doneCount = Math.floor((current / target) * weeks);
            const isCompleted = i < doneCount;
            const isActive = i === doneCount;
            return (
              <motion.div
                key={i}
                initial={{ scaleY: 0.4, opacity: 0 }}
                whileInView={{ scaleY: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 + 0.1 }}
                suppressHydrationWarning
                className={`flex-1 rounded-full ${
                  isCompleted
                    ? "bg-orange-400"
                    : isActive
                      ? "bg-violet-400 animate-pulse"
                      : "bg-gray-100"
                }`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-gray-300 font-semibold">Week 1</span>
          <span className="text-[9px] text-gray-300 font-semibold">
            Week {weeks}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── RoadmapPhaseCard ─────────────────────────────────────────────
interface RoadmapPhaseCardProps {
  phase: RoadmapPhase;
  index: number;
  isLast: boolean;
}

function RoadmapPhaseCard({ phase, index, isLast }: RoadmapPhaseCardProps) {
  const { skill, weekLabel, phase: phaseNum } = phase;
  const palette = getPalette(index);
  const levelPct = getLevelPct(skill.importance);
  const urgency = URGENCY_LABELS[skill.importance] ?? URGENCY_LABELS.nice;
  const isEven = index % 2 === 0;

  return (
    <div className="relative">
      {/* Connector line segment — skip on last card */}
      {!isLast && (
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.12 + 0.4 }}
          suppressHydrationWarning
          className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-10 bg-linear-to-b from-gray-200 to-transparent origin-top z-0"
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{
          duration: 0.55,
          delay: index * 0.1,
          ease: [0.22, 1, 0.36, 1],
        }}
        suppressHydrationWarning
        className={`group relative flex ${isEven ? "flex-row" : "flex-row-reverse"} items-start gap-0`}
      >
        {/* ── Numbered Node ── */}
        <div className="relative z-10 flex flex-col items-center shrink-0 mx-4">
          <div
            className={`absolute inset-0 rounded-full bg-linear-to-br ${palette.bg} blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 scale-150`}
          />
          <motion.div
            whileHover={{ scale: 1.12 }}
            transition={{ type: "spring", stiffness: 300 }}
            suppressHydrationWarning
            className={`relative w-16 h-16 rounded-full bg-linear-to-br ${palette.bg} shadow-lg ${palette.glow} flex items-center justify-center ring-4 ring-white`}
          >
            <span className="text-2xl font-black text-white">
              {phaseNum + 1}
            </span>
          </motion.div>
          <div className="mt-2 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded -rotate-1 shadow-sm whitespace-nowrap">
            {weekLabel}
          </div>
        </div>

        {/* ── Card ── */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
          suppressHydrationWarning
          className="flex-1 min-w-0 bg-white rounded-3xl border border-gray-100 shadow-md group-hover:shadow-xl group-hover:border-gray-200 transition-all duration-300 overflow-hidden relative"
        >
          <div className={`h-1.5 bg-linear-to-r ${palette.bg}`} />

          <div className="p-5 relative">
            <div
              className={`absolute top-0 ${isEven ? "right-0" : "left-0"} font-black leading-none select-none pointer-events-none ${palette.num}`}
              style={{ fontSize: 96, opacity: 0.07, lineHeight: 1 }}
            >
              {phaseNum + 1}
            </div>

            <div className="flex items-center justify-between mb-3">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${palette.soft}`}
              >
                {urgency.icon} {urgency.label}
              </span>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock size={11} />
                <span className="text-xs font-bold">
                  ~{skill.estimatedHours}h
                </span>
              </div>
            </div>

            <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">
              {skill.skill}
            </h3>

            <div
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl border mb-4 ${palette.soft}`}
            >
              {getCategoryIcon(skill.category, 11)}
              {skill.category}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Your Starting Point
                </span>
                <span className="text-[10px] font-bold text-gray-500">
                  {levelPct}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${levelPct}%` }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.9,
                    delay: index * 0.1 + 0.35,
                    ease: "easeOut",
                  }}
                  suppressHydrationWarning
                  className={`h-full rounded-full bg-linear-to-r ${palette.bar}`}
                />
              </div>
              <div className="flex justify-between mt-1">
                {["0%", "25%", "50%", "75%", "100%"].map((t) => (
                  <span
                    key={t}
                    className="text-[8px] text-gray-300 font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {skill.resources && skill.resources.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-1.5">
                  Free Resources
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skill.resources.slice(0, 3).map((r, ri) => (
                    <a
                      key={ri}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open resource: ${r.title}`}
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all hover:scale-[1.03] ${palette.soft}`}
                    >
                      <ExternalLink size={8} />
                      {r.title.length > 28
                        ? r.title.slice(0, 28) + "…"
                        : r.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Link href="/career/modules">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                suppressHydrationWarning
                aria-label={`Unlock module: ${skill.skill}`}
                className={`w-full bg-linear-to-r ${palette.bg} text-white font-black text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow`}
              >
                <Lock size={13} /> Unlock This Phase <ArrowRight size={13} />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function CareerAnalysePage() {
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [noProfile, setNoProfile] = useState(false);

  const loadLatest = useCallback(async () => {
    try {
      const res = await fetch("/api/career/analyse?latest=1");
      if (res.ok) {
        const json = await res.json();
        setAnalysis(json.data ?? null);
        if (!json.data && !json.hasProfile) setNoProfile(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  async function runAnalysis() {
    setRunning(true);
    try {
      const res = await fetch("/api/career/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.status === 400 && json.error?.includes("profile")) {
        setNoProfile(true);
        toast.error("Complete your career profile first.");
        return;
      }
      if (!res.ok) {
        toast.error(json.error || "Analysis failed. Try again.");
        return;
      }
      setAnalysis(json.data);
      toast.success("Analysis complete! +75 XP");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setRunning(false);
    }
  }

  const critical =
    analysis?.gap_skills.filter((s) => s.importance === "critical") ?? [];
  const nice =
    analysis?.gap_skills.filter((s) => s.importance === "nice") ?? [];

  const roadmapSkills: SkillGap[] = analysis
    ? [
        ...analysis.gap_skills.filter((s) => s.importance === "critical"),
        ...analysis.gap_skills.filter((s) => s.importance === "important"),
      ].slice(0, 6)
    : [];

  const roadmapPhases: RoadmapPhase[] = roadmapSkills.map((skill, i) => ({
    weekLabel: `Week ${i * 2 + 1}\u2013${i * 2 + 2}`,
    skill,
    phase: i,
  }));

  const targetReadiness = analysis
    ? Math.min(95, analysis.match_score + roadmapSkills.length * 8)
    : 0;
  const totalHours = roadmapSkills.reduce(
    (a, b) => a + (b.estimatedHours || 15),
    0,
  );
  const topCriticalChips = roadmapSkills.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* HERO */}
      <div className="relative overflow-hidden gradient-hero mx-6 mt-6 rounded-2xl px-6 py-8">
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
              <BarChart2 size={18} className="text-white!" />
            </div>
            <span className="text-white/80! text-sm font-semibold">
              Skill Gap Intelligence
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            suppressHydrationWarning
            className="text-3xl md:text-4xl font-extrabold text-white! mb-2"
          >
            How Ready Are You?
          </motion.h1>
          <motion.p
            variants={fadeUp}
            suppressHydrationWarning
            className="text-white/80 text-sm"
          >
            Compare your skills with your target career to identify gaps and get
            your path forward
          </motion.p>
        </motion.div>
      </div>

      <div className="px-6 md:px-8 pt-5 pb-12">
        {/* No profile warning */}
        {noProfile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            suppressHydrationWarning
            className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">
                Career profile not found
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                You need to complete your career profile before running an
                analysis.
              </p>
            </div>
            <Link href="/career/profile">
              <Button size="sm">Set up Profile</Button>
            </Link>
          </motion.div>
        )}

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 h-52 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* ── RESULTS ── */}
        {!loading && analysis && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col gap-6"
          >
            {/* 2-Panel Dense Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-stretch">
              {/* 📊 LEFT PANEL (1/3 width) - Score & Breakdown */}
              <motion.div
                variants={fadeUp}
                suppressHydrationWarning
                className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full"
              >
                {/* Score section */}
                <div className="flex flex-col items-center justify-center pt-4 pb-6 flex-1">
                  <SkillMatchScore
                    score={analysis.match_score}
                    size={150}
                    targetRole={analysis.target_career}
                  />
                  <div className="mt-6 text-center w-full">
                    <p className="text-red-500 font-bold text-sm mb-1 px-4">
                      You need +{Math.max(0, 100 - analysis.match_score)}% to
                      reach {analysis.target_career}
                    </p>
                    <p className="text-gray-500 text-[10px] font-medium">
                      Focus on {critical.length} critical gaps to improve
                      fastest
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-4" />

                {/* Breakdown section */}
                <div>
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <TrendingUp size={14} className="text-primary" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Skill Breakdown
                    </p>
                  </div>
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-600 uppercase tracking-wider">
                        Technical
                      </span>
                      <span className="font-bold text-gray-900">
                        {Math.min(95, analysis.match_score + 15)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${Math.min(95, analysis.match_score + 15)}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        suppressHydrationWarning
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-600 uppercase tracking-wider">
                        Analytical
                      </span>
                      <span className="font-bold text-gray-900">
                        {Math.min(90, analysis.match_score + 5)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${Math.min(90, analysis.match_score + 5)}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        suppressHydrationWarning
                        className="h-full bg-violet-500 rounded-full"
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-600 uppercase tracking-wider">
                        Practical
                      </span>
                      <span className="font-bold text-gray-900">
                        {Math.max(10, analysis.match_score - 10)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${Math.max(10, analysis.match_score - 10)}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        suppressHydrationWarning
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 🧠 RIGHT PANEL (2/3 width) - AI Summary & Required Skills */}
              <motion.div
                variants={fadeUp}
                suppressHydrationWarning
                className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full"
              >
                {/* Summary Section */}
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 shrink-0 mb-4">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Sparkles size={15} className="text-purple-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      AI Summary
                    </p>
                  </div>

                  <div className="space-y-3 text-sm text-gray-700 leading-relaxed overflow-hidden py-1 mb-6">
                    {analysis.ai_summary.split("\n").map((line, i) => {
                      const t = line.trim();
                      if (!t) return null;
                      const isHeader =
                        t.includes("🔍") ||
                        t.includes("⚠️") ||
                        t.includes("🎯") ||
                        t.startsWith("**");
                      return (
                        <p
                          key={i}
                          className={
                            isHeader
                              ? "font-bold text-gray-900 mt-4 text-base flex items-center gap-2"
                              : "pl-4 border-l-2 border-purple-500/20 ml-2 py-1 text-gray-600 block"
                          }
                        >
                          {t.replace(/\*\*/g, "")}
                        </p>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 shrink-0 pb-4 mt-auto">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100/80">
                      <AlertCircle size={11} className="text-red-400" />
                      <strong className="text-gray-700">
                        {critical.length}
                      </strong>{" "}
                      critical gaps
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100/80">
                      <TrendingUp size={11} className="text-blue-400" />
                      <strong className="text-gray-700">
                        {analysis.gap_skills.length}
                      </strong>{" "}
                      total gaps
                    </span>
                    <span className="ml-auto text-[10px] text-gray-300">
                      {new Date(analysis.created_at).toLocaleDateString(
                        "en-MY",
                      )}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-4" />

                {/* Required Skills Section */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
                    <Zap size={14} className="text-violet-500" /> Required for{" "}
                    <span className="text-violet-600 font-bold">
                      {analysis.target_career}
                    </span>
                  </p>
                  {analysis.required_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analysis.required_skills.map((s) => (
                        <span
                          key={s.skill}
                          className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1.5 rounded-xl font-medium hover:bg-violet-100 transition-colors cursor-default"
                        >
                          {s.skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No specific required skills documented.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Nice to have */}
            {nice.length > 0 && (
              <motion.div variants={fadeUp} suppressHydrationWarning>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-bold text-gray-500">
                    Nice to Have
                  </p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                    {nice.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nice.map((gap, i) => (
                    <motion.div
                      key={gap.skill}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      suppressHydrationWarning
                    >
                      <SkillGapCard gap={gap} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── PERSONALIZED LEARNING ROADMAP ── */}
            {roadmapPhases.length > 0 && (
              <motion.div
                variants={fadeUp}
                suppressHydrationWarning
                className="mt-10 mb-4"
              >
                {/* Section Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 px-4 py-1.5 rounded-full mb-4">
                    <Zap size={12} className="text-violet-500" />
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                      AI-Generated Roadmap
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-1 relative inline-block">
                    Your Personalised Learning Plan
                    <motion.span
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.6,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                      suppressHydrationWarning
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-linear-to-r from-violet-500 to-indigo-500 rounded-full origin-left block"
                    />
                  </h2>
                  <p className="text-sm text-gray-500 mt-3">
                    Personalised for{" "}
                    <span className="font-semibold text-violet-600">
                      {analysis.target_career}
                    </span>{" "}
                    — {roadmapPhases.length} phases · ~{totalHours}h total
                  </p>
                </div>

                {/* Readiness Journey Bar */}
                <ReadinessProgressBar
                  current={analysis.match_score}
                  target={targetReadiness}
                  weeks={roadmapPhases.length * 2}
                />

                {/* Focus Area Chips */}
                {topCriticalChips.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {topCriticalChips.map((skill, i) => {
                      const p = getPalette(i);
                      return (
                        <motion.div
                          key={skill.skill}
                          whileHover={{ y: -3, scale: 1.04 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                          }}
                          suppressHydrationWarning
                          aria-label={`Focus skill: ${skill.skill}`}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 cursor-default ${p.soft} shadow-sm`}
                        >
                          {getCategoryIcon(skill.category, 13)}
                          <span className="text-sm font-black">
                            {skill.skill}
                          </span>
                          <span className="text-[9px] font-black opacity-60 uppercase tracking-wider">
                            Phase {i + 1}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Timeline */}
                <div className="relative">
                  <div className="flex flex-col gap-10">
                    {roadmapPhases.map((phase, index) => (
                      <RoadmapPhaseCard
                        key={phase.skill.skill}
                        phase={phase}
                        index={index}
                        isLast={index === roadmapPhases.length - 1}
                      />
                    ))}
                  </div>
                </div>

                {/* AI Recommendation Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  suppressHydrationWarning
                  className="mt-4 rounded-2xl border-2 border-violet-200 bg-linear-to-r from-violet-50 to-white p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Bot size={20} className="text-violet-600 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-1">
                      AI Recommendation
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {getAiFirstSentence(analysis.ai_summary)}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* RECOMMENDED NEXT STEP CTA */}
            <motion.div
              variants={fadeUp}
              suppressHydrationWarning
              className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-6"
            >
              <div className="flex-1 w-full text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Compass size={16} />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-lg">
                    Recommended Next Step
                  </h3>
                </div>
                <p className="text-sm text-gray-500 max-w-md mx-auto lg:mx-0">
                  We suggest tackling{" "}
                  <strong className="text-gray-800">
                    {critical[0]?.skill || "your weakest skills"}
                  </strong>{" "}
                  first. How would you like to proceed?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                <Link
                  href="/career/modules?guided=true"
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 text-white! font-bold h-11 px-6 transition-all">
                    <Zap size={15} /> Follow Recommended Path
                  </Button>
                </Link>
                <Link href="/career/modules" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold h-11 px-6 transition-colors bg-white relative">
                    Explore Modules
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              variants={fadeUp}
              suppressHydrationWarning
              className="flex justify-center pt-8 pb-4"
            >
              <Button
                onClick={runAnalysis}
                disabled={running}
                className="text-gray-400 text-xs hover:text-gray-600 bg-transparent shadow-none"
                variant="outline"
              >
                {running ? (
                  <Loader2 size={12} className="animate-spin mr-1.5" />
                ) : (
                  <RefreshCw size={12} className="mr-1.5" />
                )}
                Update My Progress
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && !analysis && !noProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            suppressHydrationWarning
            className="mt-6 text-center py-10"
          >
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 max-w-md mx-auto flex flex-col items-center gap-5">
              <div className="w-20 h-20 bg-linear-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center">
                <BarChart2 size={32} className="text-violet-500" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                  No analysis yet
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Run your first skill gap analysis to see where you stand and
                  get a personalised learning plan.
                </p>
              </div>
              <Button
                onClick={runAnalysis}
                disabled={running}
                size="lg"
                className="w-full"
              >
                {running ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />{" "}
                    Analysing…
                  </>
                ) : (
                  <>
                    <Zap size={16} className="mr-2" /> Reveal My Readiness
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
