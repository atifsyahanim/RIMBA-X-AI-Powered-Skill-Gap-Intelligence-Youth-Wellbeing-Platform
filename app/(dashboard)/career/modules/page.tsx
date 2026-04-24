"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  List,
  LayoutGrid,
  Sparkles,
  CheckCircle,
  Zap,
  ArrowRight,
  RefreshCw,
  Clock,
  ChevronDown,
} from "lucide-react";
import { ModuleCard } from "@/components/career/ModuleCard";
import { Button } from "@/components/ui/Button";
import type { LearningModule } from "@/types";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

async function getAuthToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

const STATUSES: { key: string; label: string; color: string; dot: string }[] = [
  {
    key: "not_started",
    label: "Not Started",
    color: "text-gray-500",
    dot: "bg-gray-300",
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "text-blue-600",
    dot: "bg-blue-400",
  },
  {
    key: "completed",
    label: "Completed",
    color: "text-emerald-600",
    dot: "bg-emerald-400",
  },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function CareerModulesPage() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const url =
        filter === "all"
          ? "/api/career/modules"
          : `/api/career/modules?status=${filter}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      console.log("MODULE API RESPONSE:", json);
      setModules(json.modules ?? json.data?.modules ?? []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  function handleUpdate(id: string, updated: LearningModule) {
    setModules((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  const byStatus = (status: string) =>
    modules.filter((m) => m.status === status);
  const displayed =
    filter === "all" ? modules : modules.filter((m) => m.status === filter);
  const completedPct =
    modules.length > 0
      ? Math.round((byStatus("completed").length / modules.length) * 100)
      : 0;

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
              <BookOpen size={18} className="!text-white" />
            </div>
            <span className="!text-white/80 text-sm font-semibold">
              Learning Modules
            </span>
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 !text-white px-2 py-0.5 rounded-full">
              <Sparkles size={9} /> AI-Curated
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            suppressHydrationWarning
            className="text-3xl md:text-4xl font-extrabold !text-white mb-2"
          >
            Your Learning Path
          </motion.h1>
          <motion.p
            variants={fadeUp}
            suppressHydrationWarning
            className="text-white/80 text-sm mb-5"
          >
            Skill-targeted resources personalised from your gap analysis
          </motion.p>

          {/* Progress summary */}
          {!loading && modules.length > 0 && (
            <motion.div
              variants={fadeUp}
              suppressHydrationWarning
              className="bg-white/10 rounded-2xl p-4 max-w-md flex items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="!text-white/80 text-xs font-semibold">
                    Completion
                  </span>
                  <span className="!text-white font-extrabold">
                    {completedPct}%
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completedPct}%` }}
                    transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                    suppressHydrationWarning
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 !text-white bg-white/20 rounded-xl px-3 py-2">
                <CheckCircle size={14} />
                <span className="text-sm font-extrabold">
                  {byStatus("completed").length}/{modules.length}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="px-6 md:px-8 pt-5 pb-12">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          suppressHydrationWarning
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 mb-6 flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all
                ${filter === "all" ? "gradient-hero !text-white border-transparent shadow-sm" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#8B5CF6]"}`}
            >
              All ({modules.length})
            </button>
            {STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5
                  ${filter === s.key ? "gradient-hero !text-white border-transparent shadow-sm" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#8B5CF6]"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${filter === s.key ? "bg-white" : s.dot}`}
                />
                {s.label} ({byStatus(s.key).length})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/career/analyse"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-[#8B5CF6] hover:bg-violet-100 transition-all"
            >
              <RefreshCw size={11} />
              Re-run Analysis
            </Link>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setView("kanban")}
                className={`p-2 rounded-lg transition-all ${view === "kanban" ? "bg-white shadow-sm text-[#8B5CF6]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white shadow-sm text-[#8B5CF6]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 h-44 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && modules.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 max-w-sm mx-auto flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl flex items-center justify-center">
                <BookOpen size={32} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                  No modules yet
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  Run a skill gap analysis to generate your personalised
                  learning path.
                </p>
              </div>
              <Link href="/career/analyse" className="w-full">
                <Button className="w-full flex items-center justify-center gap-1.5">
                  <Zap size={14} /> Go to Analysis <ArrowRight size={13} />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* KANBAN */}
        {!loading &&
          modules.length > 0 &&
          view === "kanban" &&
          filter === "all" && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {STATUSES.map((col) => (
                <motion.div
                  key={col.key}
                  variants={fadeUp}
                  suppressHydrationWarning
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${col.color}`}
                    >
                      {col.label}
                    </span>
                    <span className="text-xs text-gray-300 ml-1">
                      (
                      {col.key === "in_progress" ? 1 : byStatus(col.key).length}
                      )
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {col.key === "in_progress" ? (
                      <motion.div
                        variants={fadeUp}
                        suppressHydrationWarning
                        className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden"
                      >
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-amber-100 text-amber-700 w-fit mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Intermediate
                              </span>
                              <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[40px] flex items-center">
                                Computer Vision: Intelligent Detection Systems
                              </h3>
                              <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                                Level 1 — Understand
                              </p>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                In Progress
                              </span>
                              <span className="text-[11px] font-bold text-gray-700">
                                20%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{ width: "20%" }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              12h
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen size={10} />3 resources
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href="/career/modules/computer-vision-detection-system"
                              className="flex-1"
                            >
                              <button className="w-full flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 !text-white text-xs font-bold py-2 rounded-xl transition-all">
                                Continue Module <ArrowRight size={12} />
                              </button>
                            </Link>
                            <button
                              disabled
                              className="flex items-center gap-1 text-xs text-gray-400 px-2.5 py-2 rounded-xl opacity-30 cursor-not-allowed"
                            >
                              <ChevronDown size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : byStatus(col.key).length === 0 ? (
                      <div className="bg-white/60 rounded-2xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-300">
                        Empty
                      </div>
                    ) : (
                      byStatus(col.key).map((mod, i) => (
                        <motion.div
                          key={mod.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          suppressHydrationWarning
                        >
                          <ModuleCard
                            module={mod}
                            onUpdate={(updated) =>
                              handleUpdate(mod.id, updated)
                            }
                          />
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        {/* LIST VIEW */}
        {!loading &&
          modules.length > 0 &&
          (view === "list" || filter !== "all") && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="flex flex-col gap-3"
            >
              {displayed.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  variants={fadeUp}
                  suppressHydrationWarning
                >
                  <ModuleCard
                    module={mod}
                    onUpdate={(updated) => handleUpdate(mod.id, updated)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
      </div>
    </div>
  );
}
