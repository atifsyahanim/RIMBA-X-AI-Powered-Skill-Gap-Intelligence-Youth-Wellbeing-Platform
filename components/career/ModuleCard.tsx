"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Clock,
  ChevronDown,
  CheckCircle,
  ExternalLink,
  Loader2,
  Play,
} from "lucide-react";
import type { LearningModule } from "@/types";
import toast from "react-hot-toast";

const difficultyConfig = {
  beginner: {
    label: "Beginner",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-400",
  },
  intermediate: {
    label: "Intermediate",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
  },
  advanced: {
    label: "Advanced",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-400",
  },
};

const statusConfig = {
  not_started: { label: "Not Started", badge: "bg-gray-100 text-gray-500" },
  in_progress: { label: "In Progress", badge: "bg-blue-100 text-blue-600" },
  completed: { label: "Completed", badge: "bg-emerald-100 text-emerald-700" },
};

interface ModuleCardProps {
  module: LearningModule;
  onUpdate?: (updated: LearningModule) => void;
}

export function ModuleCard({ module, onUpdate }: ModuleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const diff =
    difficultyConfig[module.difficulty as keyof typeof difficultyConfig] ??
    difficultyConfig.beginner;
  const stat =
    statusConfig[module.status as keyof typeof statusConfig] ??
    statusConfig.not_started;
  const isCompleted = module.status === "completed";
  const isInProgress = module.status === "in_progress";

  const updateStatus = async (newStatus: LearningModule["status"]) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/career/modules/${module.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate?.(data.module);
        toast.success(
          newStatus === "completed"
            ? "🎉 Module completed! +150 XP"
            : "▶️ Module started! +25 XP",
        );
      } else {
        toast.error(data.error ?? "Failed to update");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      whileHover={!isCompleted ? { y: -2 } : {}}
      suppressHydrationWarning
      className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md
        ${isCompleted ? "border-emerald-200" : "border-gray-100"} shadow-sm`}
    >
      {/* Status accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: isCompleted
            ? "linear-gradient(90deg,#10b981,#059669)"
            : isInProgress
              ? "linear-gradient(90deg,#3b82f6,#6366f1)"
              : "#e2e8f0",
        }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${diff.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                {diff.label}
              </span>
              {isCompleted && (
                <CheckCircle size={12} className="text-emerald-500" />
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-sm leading-snug min-h-[40px] line-clamp-2 flex items-center">
              {module.title}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {module.skill_target}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stat.badge}`}
            >
              {stat.label}
            </span>
            <span className="text-[11px] font-bold text-gray-700">
              {module.completion_pct}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${module.completion_pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              suppressHydrationWarning
              className="h-full rounded-full"
              style={{
                background: isCompleted
                  ? "#10b981"
                  : "linear-gradient(90deg,#3b82f6,#6366f1)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {module.estimated_hours}h
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={10} />
            {module.resources.length} resources
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {module.status === "not_started" && (
            <button
              onClick={() => updateStatus("in_progress")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>
                  <Play size={11} /> Start
                </>
              )}
            </button>
          )}
          {module.status === "in_progress" && (
            <button
              onClick={() => updateStatus("completed")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold py-2 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle size={11} /> Complete
                </>
              )}
            </button>
          )}
          {isCompleted && (
            <span className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold py-2 rounded-xl">
              <CheckCircle size={11} /> Completed
            </span>
          )}
          {module.resources.length > 0 && (
            <button
              onClick={() => setExpanded((x) => !x)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary px-2.5 py-2 rounded-xl hover:bg-gray-50 transition-all"
            >
              <ChevronDown
                size={13}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Resources */}
      <AnimatePresence>
        {expanded && module.resources.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            suppressHydrationWarning
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Resources
              </p>
              {module.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:text-primary-hover group transition-colors bg-white rounded-lg px-2.5 py-1.5"
                >
                  <ExternalLink
                    size={10}
                    className="opacity-50 group-hover:opacity-100 shrink-0"
                  />
                  <span className="truncate font-medium">{r.title}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
