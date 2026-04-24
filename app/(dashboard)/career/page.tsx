"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  BarChart2,
  BookOpen,
  FileText,
  Loader2,
  User,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Star,
  Zap,
  ArrowRight,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface HubStats {
  profile_complete: boolean;
  target_career: string | null;
  match_score: number | null;
  active_modules: number;
  resume_count: number;
  total_modules: number;
  completed_modules: number;
}

const JOURNEY_STEPS = [
  {
    num: 1,
    href: "/career/profile",
    icon: User,
    title: "Profile",
    subtitle: "Education & skills",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    num: 2,
    href: "/career/analyse",
    icon: BarChart2,
    title: "Analysis",
    subtitle: "Skill gap insights",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    num: 3,
    href: "/career/modules",
    icon: BookOpen,
    title: "Learn",
    subtitle: "Track modules",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    num: 4,
    href: "/career/resume",
    icon: FileText,
    title: "Resume",
    subtitle: "AI-crafted CV",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    num: 5,
    href: "/career/recommend",
    icon: Star,
    title: "Recommend",
    subtitle: "Career paths",
    gradient: "from-amber-400 to-orange-500",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function CareerHubPage() {
  const [stats, setStats] = useState<HubStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Get the current user first
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const [profileRes, modulesRes, resumeRes] = await Promise.allSettled([
          fetch(`/api/career/profile?user_id=${user?.id}`),
          fetch("/api/career/modules"),
          fetch("/api/career/resume"),
        ]);
        const profile =
          profileRes.status === "fulfilled" && profileRes.value.ok
            ? await profileRes.value.json()
            : null;
        const profileData = profile?.data ?? null;
        const modulesJson =
          modulesRes.status === "fulfilled" && modulesRes.value.ok
            ? await modulesRes.value.json()
            : {};
        const modules: { status: string }[] = Array.isArray(modulesJson)
          ? modulesJson
          : (modulesJson.modules ?? []);
        const resumesJson =
          resumeRes.status === "fulfilled" && resumeRes.value.ok
            ? await resumeRes.value.json()
            : {};
        const resumes: unknown[] = Array.isArray(resumesJson)
          ? resumesJson
          : (resumesJson.resumes ?? []);

        setStats({
          profile_complete: !!profileData,
          target_career: profileData?.target_career ?? null,
          match_score: null,
          active_modules: modules.filter((m) => m.status === "in_progress")
            .length,
          resume_count: resumes.length,
          total_modules: modules.length,
          completed_modules: modules.filter((m) => m.status === "completed")
            .length,
        });
      } catch {
        setStats({
          profile_complete: false,
          target_career: null,
          match_score: null,
          active_modules: 0,
          resume_count: 0,
          total_modules: 0,
          completed_modules: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const readiness =
    !loading && stats
      ? (stats.profile_complete ? 20 : 0) +
        (stats.match_score != null ? 20 : 0) +
        (stats.total_modules > 0 ? 20 : 0) +
        (stats.total_modules > 0
          ? Math.round((stats.completed_modules / stats.total_modules) * 20)
          : 0) +
        (stats.resume_count > 0 ? 20 : 0)
      : 0;

  const statCards = [
    {
      label: "Profile",
      value: stats?.profile_complete ? (
        <CheckCircle2 size={24} className="text-emerald-500" />
      ) : (
        <span className="text-gray-300">—</span>
      ),
      sub: stats?.profile_complete ? "Complete" : "Not set up",
      icon: User,
      iconClass: "bg-blue-50 text-blue-500",
    },
    {
      label: "Skill Match",
      value: (
        <span>
          {stats?.match_score != null ? `${stats.match_score}%` : "—"}
        </span>
      ),
      sub: "vs. target role",
      icon: TrendingUp,
      iconClass: "bg-violet-50 text-violet-500",
    },
    {
      label: "Modules",
      value: (
        <span>
          {stats?.completed_modules ?? 0}
          <span className="text-gray-300 font-normal">
            /{stats?.total_modules ?? 0}
          </span>
        </span>
      ),
      sub: `${stats?.active_modules ?? 0} in progress`,
      icon: BookOpen,
      iconClass: "bg-emerald-50 text-emerald-500",
    },
    {
      label: "Resumes",
      value: <span>{stats?.resume_count ?? 0}</span>,
      sub: "AI-generated",
      icon: FileText,
      iconClass: "bg-pink-50 text-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-indigo-600 mx-6 mt-6 rounded-2xl px-6 py-8">
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
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="text-white/80 text-sm font-semibold">
              Career Hub
            </span>
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
              <Sparkles size={9} /> AI-Powered
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            suppressHydrationWarning
            className="text-3xl md:text-4xl font-extrabold text-white mb-2 leading-tight"
          >
            Your Career Journey
          </motion.h1>
          <motion.p
            variants={fadeUp}
            suppressHydrationWarning
            className="text-indigo-100 text-sm mb-6"
          >
            Analyse, learn and land your dream role — fully personalised by AI
          </motion.p>

          {/* Readiness bar */}
          {!loading && (
            <motion.div
              variants={fadeUp}
              suppressHydrationWarning
              className="bg-white/10 rounded-2xl p-4 max-w-md"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                  Overall Readiness
                </span>
                <span className="text-white font-extrabold text-xl">
                  {readiness}%
                </span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${readiness}%` }}
                  transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
                  suppressHydrationWarning
                  className="h-full bg-white rounded-full"
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="px-6 md:px-8 pt-5">
        {/* ── PROFILE BANNER ── */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            suppressHydrationWarning
            className={`mb-5 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3
              ${
                stats?.profile_complete
                  ? "bg-indigo-50 border border-indigo-100"
                  : "bg-amber-50 border border-amber-200"
              }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                ${stats?.profile_complete ? "bg-indigo-100" : "bg-amber-100"}`}
              >
                <User
                  size={15}
                  className={
                    stats?.profile_complete
                      ? "text-indigo-600"
                      : "text-amber-600"
                  }
                />
              </div>
              <div>
                {stats?.profile_complete ? (
                  <p className="text-sm font-bold text-gray-900">
                    Target:{" "}
                    <span className="text-indigo-600">
                      {stats.target_career ?? "Set in Profile"}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm font-bold text-gray-900">
                    No career profile yet
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {stats?.profile_complete
                    ? "Your profile is active — all features unlocked"
                    : "Set up your profile to unlock AI analysis & recommendations"}
                </p>
              </div>
            </div>
            <Link
              href="/career/profile"
              className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors
                ${
                  stats?.profile_complete
                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
            >
              {stats?.profile_complete ? (
                <>
                  <Pencil size={12} /> Edit Profile
                </>
              ) : (
                <>
                  Get Started <ArrowRight size={12} />
                </>
              )}
            </Link>
          </motion.div>
        )}
        {/* ── STAT CARDS (floating over hero) ── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 h-24 animate-pulse"
                />
              ))
            : statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    variants={fadeUp}
                    suppressHydrationWarning
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        {card.label}
                      </p>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.iconClass}`}
                      >
                        <Icon size={14} />
                      </div>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">
                      {card.value}
                    </p>
                    <p className="text-[11px] text-gray-400">{card.sub}</p>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* ── JOURNEY STEPPER ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          suppressHydrationWarning
          className="mb-8"
        >
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={13} className="text-primary" /> Career Journey
          </h2>
          <div className="relative">
            {/* Connector */}
            <div className="absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-blue-200 via-violet-200 to-amber-200 hidden md:block" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {JOURNEY_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.href}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.45 + i * 0.08,
                      type: "spring",
                      stiffness: 200,
                    }}
                    suppressHydrationWarning
                  >
                    <Link
                      href={step.href}
                      className="group flex flex-col items-center text-center gap-2 py-3 px-2 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      <div
                        className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}
                      >
                        <Icon size={22} className="text-white" />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-gray-700 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow border border-gray-100">
                          {step.num}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">
                          {step.title}
                        </p>
                        <p className="text-[10px] text-gray-400 hidden md:block">
                          {step.subtitle}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── CTA ── */}
        {!loading && !stats?.profile_complete && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            suppressHydrationWarning
            className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 flex items-center gap-4 shadow-lg"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Loader2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">
                Start your career journey in 2 minutes
              </p>
              <p className="text-blue-100 text-xs mt-0.5">
                Complete your profile to unlock AI-powered analysis &amp;
                recommendations
              </p>
            </div>
            <Link
              href="/career/profile"
              className="shrink-0 flex items-center gap-1.5 bg-white text-blue-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Get Started <ArrowRight size={12} />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
