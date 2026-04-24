"use client";

import {
  ExternalLink,
  Clock,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import type { SkillGap } from "@/types";
import Link from "next/link";

const importanceConfig = {
  critical: {
    label: "Critical",
    badge: "bg-red-200 text-red-900",
    border: "border-red-200",
    bg: "from-red-100/90 to-red-50/90",
    icon: AlertCircle,
    iconColor: "text-red-600",
    dot: "bg-red-500",
    scale: 1,
    opacity: 1,
  },
  important: {
    label: "Important",
    badge: "bg-amber-100/70 text-amber-700",
    border: "border-amber-100/60",
    bg: "from-amber-50/50 to-orange-50/40",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    dot: "bg-amber-400",
    scale: 0.98,
    opacity: 0.95,
  },
  nice: {
    label: "Nice to have",
    badge: "bg-gray-100 text-gray-500",
    border: "border-gray-100",
    bg: "from-gray-50/40 to-slate-50/30",
    icon: Lightbulb,
    iconColor: "text-gray-400",
    dot: "bg-gray-300",
    scale: 0.95,
    opacity: 0.85,
  },
};

interface SkillGapCardProps {
  gap: SkillGap;
  featured?: boolean;
}

export function SkillGapCard({ gap, featured = false }: SkillGapCardProps) {
  const cfg = importanceConfig[gap.importance] ?? importanceConfig.nice;
  const Icon = cfg.icon;

  return (
    <motion.div
      whileHover={{
        y: -3,
        scale: featured ? 1.02 : cfg.scale,
        boxShadow: "0 12px 30px rgba(0,0,0,0.09)",
      }}
      style={{
        scale: featured ? 1.02 : cfg.scale,
        opacity: featured ? 1 : cfg.opacity,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      suppressHydrationWarning
      className={`relative h-full flex flex-col bg-gradient-to-br ${cfg.bg} ${featured ? "rounded-3xl border-2" : "rounded-2xl border"} ${cfg.border} p-5 shadow-sm transform-gpu transition-all`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center bg-white/70`}
          >
            <Icon size={13} className={cfg.iconColor} />
          </div>
          <div>
            <h3
              className={`font-bold text-gray-900 ${featured ? "text-lg" : "text-sm"} leading-tight`}
            >
              {gap.skill}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{gap.category}</p>
          </div>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
            Current Level
          </span>
          <span className="text-[10px] font-semibold text-gray-700 bg-white/60 px-2 py-0.5 rounded">
            Beginner (30%)
          </span>
        </div>
        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 w-[30%] rounded-full shadow-sm" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs bg-white/60 rounded-xl px-2.5 py-1.5 mb-4 w-fit">
        <Clock size={11} className="text-gray-400" />
        <span className="text-gray-600 font-medium">
          ~{gap.estimatedHours}h to learn
        </span>
      </div>

      {gap.resources.length > 0 && (
        <div className="space-y-1.5 flex-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Free Resources
          </p>
          {gap.resources.slice(0, featured ? 3 : 2).map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-primary hover:text-primary-hover transition-colors group bg-white/60 rounded-lg px-2.5 py-1.5"
            >
              <ExternalLink
                size={10}
                className="shrink-0 opacity-60 group-hover:opacity-100"
              />
              <span className="truncate font-medium">{r.title}</span>
            </a>
          ))}
        </div>
      )}

      {/* Action CTA */}
      <div className="mt-5 pt-4 border-t border-black/5">
        <Link href="/career/modules">
          <button
            className={`w-full flex items-center justify-center gap-2 ${featured ? "bg-primary hover:bg-primary-hover text-white" : "bg-white hover:bg-gray-50 text-gray-800 border-gray-200 border"} py-2 rounded-xl text-sm font-semibold transition-colors`}
          >
            {featured ? <PlayCircle size={16} /> : <ArrowRight size={16} />}
            {featured ? "Start Module" : "Practice Now"}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
