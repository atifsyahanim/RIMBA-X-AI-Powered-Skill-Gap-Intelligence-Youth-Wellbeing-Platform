"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SkillMatchScoreProps {
  score: number;
  size?: number;
  targetRole?: string;
}

export function SkillMatchScore({
  score,
  size = 160,
  targetRole,
}: SkillMatchScoreProps) {
  const [animated, setAnimated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // All hooks MUST be called before any return statement
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, [score]);

  // Guard condition after all hooks
  if (!isClient || score === undefined || score === null || isNaN(score)) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: size, height: size }}>
          <div className="w-full h-full rounded-full bg-gray-100 animate-pulse" />
        </div>
        {targetRole && (
          <p
            className="text-xs text-gray-400 text-center leading-snug"
            style={{ maxWidth: size + 20 }}
          >
            Loading match data...
          </p>
        )}
      </div>
    );
  }

  // Ensure score is between 0 and 100
  const safeScore = Math.min(100, Math.max(0, score));

  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = animated
    ? circumference - (safeScore / 100) * circumference
    : circumference;

  const color =
    safeScore >= 70 ? "#10b981" : safeScore >= 40 ? "#f59e0b" : "#ef4444";

  const bgColor =
    safeScore >= 70
      ? "rgba(16,185,129,0.12)"
      : safeScore >= 40
        ? "rgba(245,158,11,0.12)"
        : "rgba(239,68,68,0.12)";

  const label =
    safeScore >= 70
      ? "Strong Match"
      : safeScore >= 40
        ? "Developing"
        : "Early Stage";

  const gradStop1 =
    safeScore >= 70 ? "#34d399" : safeScore >= 40 ? "#fbbf24" : "#f87171";
  const gradStop2 = color;
  const gradId = `smg-${size}`;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradStop1} />
              <stop offset="100%" stopColor={gradStop2} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Glow layer */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            opacity={0.15}
            style={{
              transition:
                "stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />
          {/* Progress */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition:
                "stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <motion.span
            key={safeScore}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 14,
            }}
            suppressHydrationWarning
            className="font-extrabold text-gray-900 leading-none"
            style={{ fontSize: size * 0.19 }}
          >
            {safeScore}%
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            suppressHydrationWarning
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
            style={{ color, background: bgColor }}
          >
            {label}
          </motion.span>
        </div>
      </div>
      {targetRole && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          suppressHydrationWarning
          className="text-xs text-gray-400 text-center leading-snug"
          style={{ maxWidth: size + 20 }}
        >
          Match to{" "}
          <span className="font-semibold text-gray-600">{targetRole}</span>
        </motion.p>
      )}
    </div>
  );
}
