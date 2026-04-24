"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Send,
  X,
  MessageCircle,
  Sparkles,
  Heart,
  Brain,
  Smile,
  Frown,
  Meh,
  Zap,
  Scale,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";

import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

type MoodType = "Happy" | "Neutral" | "Stressed" | null;
type StatusType = "processed" | "pending" | "error";

// ─────────────────────────────────────────────
// RANDOM SCENARIO GENERATOR
// ─────────────────────────────────────────────
const modulePool = [
  "Detection System Module",
  "Module 2: Data Basics",
  "Module 3: Core Practicals",
  "Module 4: Advanced Concepts",
  "Module 5: Final Project",
  "Module 1: Flashcards Review",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWeeklyData() {
  // Randomly decide if any day is skipped (0 = skipped)
  const skipDays = new Set<number>();
  // 40% chance to skip 1 day, 20% chance to skip 2
  if (Math.random() < 0.4) skipDays.add(randInt(0, 3)); // never skip today
  if (Math.random() < 0.2) skipDays.add(randInt(0, 3));

  // Generate a realistic trend (can go up, down, or mixed)
  const trendType = Math.random();
  let baseStress = randInt(25, 60);
  let baseFocus = randInt(50, 88);

  const weeklyStress: number[] = [];
  const weeklyFocus: number[] = [];

  for (let i = 0; i < 5; i++) {
    if (skipDays.has(i)) {
      weeklyStress.push(0);
      weeklyFocus.push(0);
      continue;
    }
    // trend up, down, or noisy
    if (trendType < 0.35) {
      // worsening week
      weeklyStress.push(
        Math.min(95, baseStress + i * randInt(5, 12) + randInt(-4, 4)),
      );
      weeklyFocus.push(
        Math.max(20, baseFocus - i * randInt(4, 10) + randInt(-4, 4)),
      );
    } else if (trendType < 0.65) {
      // improving week
      weeklyStress.push(
        Math.max(15, baseStress - i * randInt(4, 10) + randInt(-4, 4)),
      );
      weeklyFocus.push(
        Math.min(95, baseFocus + i * randInt(3, 8) + randInt(-4, 4)),
      );
    } else {
      // volatile / mixed
      weeklyStress.push(
        Math.min(95, Math.max(15, baseStress + randInt(-18, 22))),
      );
      weeklyFocus.push(
        Math.min(95, Math.max(20, baseFocus + randInt(-18, 18))),
      );
    }
  }

  return { weeklyStress, weeklyFocus };
}

function generateScenario() {
  const currentModule = modulePool[randInt(0, modulePool.length - 1)];
  const sessionDuration = randInt(10, 110);
  const sessionsToday = randInt(1, 5);
  const lastBreak = randInt(5, 120);
  const attemptCount = randInt(1, 6);
  const consistency = (["high", "moderate", "low"] as const)[randInt(0, 2)];
  const { weeklyStress, weeklyFocus } = generateWeeklyData();

  return {
    currentModule,
    sessionDuration,
    sessionsToday,
    lastBreak,
    attemptCount,
    consistency,
    weeklyStress,
    weeklyFocus,
  };
}

type Scenario = ReturnType<typeof generateScenario>;

// ─────────────────────────────────────────────
// DERIVE WELLBEING — independent per dimension
// ─────────────────────────────────────────────
function deriveWellbeingState(ls: Scenario) {
  const {
    sessionDuration,
    sessionsToday,
    lastBreak,
    weeklyStress,
    weeklyFocus,
    attemptCount,
  } = ls;
  const preferredSessionLength = 45;

  // --- STRESS ---
  let stressScore = 20;
  if (sessionDuration > 60) stressScore += 20;
  if (sessionDuration > 85) stressScore += 12;
  if (sessionsToday >= 3) stressScore += 16;
  if (sessionsToday >= 4) stressScore += 10;
  if (lastBreak > 60) stressScore += 14;
  if (lastBreak > 90) stressScore += 10;
  if (attemptCount >= 3) stressScore += 10;
  if (attemptCount >= 5) stressScore += 8;
  stressScore = Math.min(Math.round(stressScore + randInt(-5, 5)), 100);

  // --- FOCUS --- independent from stress
  let focusScore = 90;
  if (sessionDuration > preferredSessionLength)
    focusScore -= (sessionDuration - preferredSessionLength) * 0.65;
  if (lastBreak > 50) focusScore -= 16;
  if (lastBreak > 80) focusScore -= 10;
  if (sessionsToday >= 3) focusScore -= 10;
  if (attemptCount >= 4) focusScore -= 8;
  focusScore = Math.max(
    Math.min(Math.round(focusScore + randInt(-6, 6)), 100),
    12,
  );

  // --- ENERGY --- driven mainly by sessions + duration
  const energyScore = Math.max(
    Math.round(
      100 - sessionDuration * 0.4 - sessionsToday * 8 + randInt(-5, 5),
    ),
    18,
  );

  // --- BALANCE --- driven mainly by break gaps + session count
  const balanceScore = Math.max(
    Math.round(95 - lastBreak * 0.25 - sessionsToday * 5 + randInt(-5, 5)),
    18,
  );

  // --- LABELS --- each derived independently so they can mix
  const stressLabel: "Low" | "Moderate" | "High" =
    stressScore >= 65 ? "High" : stressScore >= 38 ? "Moderate" : "Low";

  const focusLabel: "Sharp" | "Okay" | "Distracted" =
    focusScore >= 68 ? "Sharp" : focusScore >= 46 ? "Okay" : "Distracted";

  // Emotion driven by a blend of stress + energy (not just stress)
  const emotionBlend = stressScore * 0.6 + (100 - energyScore) * 0.4;
  const emotionLabel: "Happy" | "Neutral" | "Stressed" =
    emotionBlend >= 62 ? "Stressed" : emotionBlend >= 38 ? "Neutral" : "Happy";

  // --- WEEKLY TRENDS ---
  const activeStress = weeklyStress.filter((v) => v > 0);
  const activeFocus = weeklyFocus.filter((v) => v > 0);
  const todayS = activeStress[activeStress.length - 1] ?? 50;
  const yesterdayS = activeStress[activeStress.length - 2] ?? todayS;
  const maxWeekS = Math.max(...activeStress);

  const stressTrend =
    todayS === maxWeekS && todayS > yesterdayS + 3
      ? "highest_week"
      : todayS > yesterdayS + 10
        ? "much_higher"
        : todayS > yesterdayS + 3
          ? "higher"
          : todayS < yesterdayS - 3
            ? "lower"
            : "stable";

  const focusTrend =
    activeFocus[activeFocus.length - 1] < activeFocus[0] - 15
      ? "declining"
      : activeFocus[activeFocus.length - 1] > activeFocus[0] + 8
        ? "improving"
        : "stable";

  return {
    emotion: emotionLabel,
    stress: stressLabel,
    focus: focusLabel,
    stressScore: Math.round(stressScore),
    focusScore,
    energy: Math.min(energyScore, 100),
    balance: Math.min(balanceScore, 100),
    stressTrend,
    focusTrend,
    weeklyStress: [...weeklyStress],
    weeklyFocus: [...weeklyFocus],
    preferredSessionLength,
  };
}

function getStatusType(value: string): StatusType {
  if (["Happy", "Low", "Sharp"].includes(value)) return "processed";
  if (["Stressed", "High", "Distracted"].includes(value)) return "error";
  return "pending";
}

// ─────────────────────────────────────────────
// CONTEXTUAL INSIGHT
// ─────────────────────────────────────────────
function generateInsight(
  state: ReturnType<typeof deriveWellbeingState>,
  ls: Scenario,
) {
  const { stressTrend, focusTrend, stressScore, focusScore } = state;
  const { sessionDuration, currentModule, lastBreak, attemptCount } = ls;
  const preferred = 45;
  const reasons: string[] = [];
  const actions: string[] = [];

  if (sessionDuration > preferred) {
    reasons.push(
      `You've spent ${sessionDuration} min on ${currentModule} — ${sessionDuration - preferred} min past your optimal ${preferred}-min focus window.`,
    );
    actions.push(`Pause ${currentModule} and take a 15-min break now.`);
  }
  if (lastBreak > 60) {
    reasons.push(
      `Your last break was ${lastBreak} minutes ago, driving cognitive fatigue.`,
    );
    actions.push("Step away from the screen for at least 10 minutes.");
  }
  if (attemptCount >= 3) {
    reasons.push(
      `You've attempted this module ${attemptCount} times — repeated struggle increases stress without improving retention.`,
    );
    actions.push("Switch to a lighter module and revisit this tomorrow.");
  }
  if (stressTrend === "highest_week") {
    reasons.push("Today is your most stressed session of the week.");
    actions.push("Avoid starting any new modules today.");
  } else if (stressTrend === "much_higher") {
    reasons.push("Stress spiked significantly compared to yesterday.");
    actions.push("Reduce intensity — avoid new concepts today.");
  }
  if (focusTrend === "declining") {
    reasons.push("Your focus has been declining steadily throughout the week.");
    actions.push(
      "Limit tomorrow's session to 30–40 minutes to reset your baseline.",
    );
  }
  if (stressScore < 38 && focusScore > 68) {
    reasons.push("You're in a strong cognitive state right now.");
    actions.push(
      `Use this window to tackle the hardest part of ${currentModule}.`,
    );
  }
  if (lastBreak < 30 && sessionDuration < preferred) {
    reasons.push("Good pacing — you're taking breaks at the right intervals.");
    actions.push(
      "Keep this rhythm and finish the current module section before your next break.",
    );
  }
  if (reasons.length === 0) {
    reasons.push(`You're pacing yourself well on ${currentModule}.`);
    actions.push(
      "Maintain your current rhythm and keep sessions under 45 minutes.",
    );
  }
  return {
    reason: reasons[0],
    action: actions[0],
    allReasons: reasons,
    allActions: actions,
  };
}

// ─────────────────────────────────────────────
// MODULE RECS
// ─────────────────────────────────────────────
const modulesLib = [
  { name: "Detection System Module", load: "high", emoji: "🔬" },
  { name: "Module 2: Data Basics", load: "low", emoji: "📊" },
  { name: "Module 3: Core Practicals", load: "medium", emoji: "📖" },
  { name: "Module 4: Advanced Concepts", load: "high", emoji: "🚀" },
  { name: "Module 5: Final Project", load: "high", emoji: "🎯" },
  { name: "Module 1: Flashcards Review", load: "low", emoji: "🃏" },
] as const;

function getModuleRecommendation(stress: string, currentModule: string) {
  if (stress === "High") {
    const lighter = modulesLib.filter(
      (m) => m.load === "low" && m.name !== currentModule,
    );
    return {
      type: "switch" as const,
      module: lighter[0] ?? modulesLib[1],
      message:
        "Your learning path has been adjusted. Switch to a lighter module to reduce cognitive load.",
    };
  }
  if (stress === "Moderate") {
    const medium = modulesLib.filter(
      (m) => m.load === "medium" && m.name !== currentModule,
    );
    return {
      type: "ease" as const,
      module: medium[0] ?? modulesLib[2],
      message:
        "Consider easing into a medium-load module before resuming intensive work.",
    };
  }
  const advanced = modulesLib.filter(
    (m) => m.load === "high" && m.name !== currentModule,
  );
  return {
    type: "continue" as const,
    module: advanced[0] ?? modulesLib[3],
    message: "You're in great shape to tackle advanced material.",
  };
}

function getGreeting(
  state: ReturnType<typeof deriveWellbeingState>,
  ls: Scenario,
) {
  if (state.stress === "High")
    return `Hi, I'm Carely 💜 I can see you've been on ${ls.currentModule} for ${ls.sessionDuration} minutes — that's a lot of cognitive load. Your stress is high and your last break was ${ls.lastBreak} min ago. How are you holding up?`;
  if (state.stress === "Moderate")
    return `Hey! I'm Carely 🌿 You're ${ls.sessionDuration} minutes into your session today. Things look okay but your focus is starting to dip. Want to talk about how you're managing?`;
  return `Hi there! I'm Carely 🌟 Your session looks balanced — ${ls.sessionDuration} minutes in with good focus. You're doing well! Anything on your mind?`;
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────
function CareHero({
  state,
  ls,
}: {
  state: ReturnType<typeof deriveWellbeingState>;
  ls: Scenario;
}) {
  const trendStatus =
    state.stressTrend === "highest_week" || state.stressTrend === "much_higher"
      ? "error"
      : state.stressTrend === "lower"
        ? "processed"
        : "pending";
  const trendLabel =
    state.stressTrend === "highest_week"
      ? "⚠ Highest This Week"
      : state.stressTrend === "much_higher"
        ? "↑ Stress Spiking"
        : state.stressTrend === "higher"
          ? "↑ Higher Than Yesterday"
          : state.stressTrend === "lower"
            ? "↓ Improving"
            : "→ Stable";

  return (
    <div className="relative overflow-hidden gradient-hero mx-6 mt-6 rounded-2xl px-6 py-8">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,white 0,white 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,white 0,white 1px,transparent 1px,transparent 28px)",
        }}
      />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10"
      >
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Heart size={18} className="!text-white" />
          </div>
          <span className="!text-white/80 text-sm font-semibold">
            CareSpace
          </span>
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 !text-white px-2 py-0.5 rounded-full">
            <Sparkles size={9} /> AI Companion
          </span>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-3xl md:text-4xl font-extrabold !text-white mb-2"
        >
          Your Wellbeing Dashboard
        </motion.h1>
        <motion.p variants={fadeUp} className="text-white/80 text-sm mb-5">
          Monitoring {ls.currentModule} · Session {ls.sessionsToday} today ·{" "}
          {ls.sessionDuration} min active
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
          {/* Each badge derived independently — they will naturally mix colors */}
          <StatusBadge
            status={getStatusType(state.emotion)}
            label={`Emotion: ${state.emotion}`}
          />
          <StatusBadge
            status={getStatusType(state.stress)}
            label={`Stress: ${state.stress}`}
          />
          <StatusBadge
            status={getStatusType(state.focus)}
            label={`Focus: ${state.focus}`}
          />
          <StatusBadge status={trendStatus} label={trendLabel} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOOD CARD
// ─────────────────────────────────────────────
const moodResponses: Record<string, { emoji: string; message: string }> = {
  Happy: {
    emoji: "😊",
    message:
      "Good to hear! Your session stats back this up — keep the momentum.",
  },
  Neutral: {
    emoji: "😐",
    message:
      "Understandable. A short break might shift this to a better state.",
  },
  Stressed: {
    emoji: "😔",
    message:
      "That tracks with your session data. Let's think about what to adjust.",
  },
};

function MoodCard() {
  const [selectedMood, setSelectedMood] = useState<MoodType>(null);
  const [showPopup, setShowPopup] = useState(false);
  const handleMoodClick = (mood: MoodType) => {
    setSelectedMood(mood);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 4000);
  };
  const moods = [
    {
      key: "Happy" as MoodType,
      icon: <Smile size={32} />,
      label: "Happy",
      color: "text-green-500",
    },
    {
      key: "Neutral" as MoodType,
      icon: <Meh size={32} />,
      label: "Neutral",
      color: "text-yellow-500",
    },
    {
      key: "Stressed" as MoodType,
      icon: <Frown size={32} />,
      label: "Stressed",
      color: "text-red-500",
    },
  ];
  return (
    <Card className="relative overflow-hidden">
      <CardHeader
        title="Your Mood Today"
        subtitle="How are you feeling right now?"
      />
      <div className="flex justify-around text-center">
        {moods.map(({ key, icon, label, color }) => (
          <button
            key={key}
            onClick={() => handleMoodClick(key)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all hover:scale-110 hover:bg-gray-50 ${selectedMood === key ? "bg-gray-100 scale-110 ring-2 ring-purple-300" : ""}`}
          >
            <span className={color}>{icon}</span>
            <p className="text-xs font-medium text-gray-600">{label}</p>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {showPopup && selectedMood && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="mt-4 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <span className="text-2xl">
              {moodResponses[selectedMood].emoji}
            </span>
            <p className="text-sm text-purple-800 font-medium">
              {moodResponses[selectedMood].message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─────────────────────────────────────────────
// WELLBEING STATS — always-visible advice
// ─────────────────────────────────────────────
function WellbeingStats({
  state,
  ls,
}: {
  state: ReturnType<typeof deriveWellbeingState>;
  ls: Scenario;
}) {
  const energyDesc =
    state.energy >= 75
      ? "Energy is holding up well for your session count today."
      : state.energy >= 50
        ? `Energy is moderate — ${ls.sessionsToday} sessions today is starting to show.`
        : `Energy is low after ${ls.sessionsToday} sessions and ${ls.sessionDuration} min. Consider ending here.`;

  const energyTip =
    state.energy >= 75
      ? "Use this energy for your most challenging tasks first."
      : state.energy >= 50
        ? "Take a 5-min break every hour to maintain this level."
        : "Try a 20-min power nap or a short walk outside.";

  const energyAction =
    state.energy >= 75
      ? "Schedule deep work sessions now"
      : state.energy >= 50
        ? "Balance work with short breaks"
        : "Prioritize rest and light activities";

  const balanceDesc =
    state.balance >= 75
      ? "Good balance between study intensity and rest today."
      : state.balance >= 50
        ? "Balance is slipping — your break gap is widening."
        : `Balance is disrupted. ${ls.lastBreak} min since last break is too long.`;

  const balanceTip =
    state.balance >= 75
      ? "Great job! Keep this rhythm going."
      : state.balance >= 50
        ? "Try time-blocking to improve balance further."
        : "Set aside 30 min today just for yourself.";

  const balanceAction =
    state.balance >= 75
      ? "Maintain current habits"
      : state.balance >= 50
        ? "Adjust by 15–20 min more rest"
        : "Major adjustment needed — rest first";

  const energyBox =
    state.energy >= 75
      ? "bg-yellow-50 border-yellow-100 text-yellow-800"
      : state.energy >= 50
        ? "bg-orange-50 border-orange-100 text-orange-800"
        : "bg-red-50 border-red-100 text-red-800";

  const balanceBox =
    state.balance >= 75
      ? "bg-blue-50 border-blue-100 text-blue-800"
      : state.balance >= 50
        ? "bg-indigo-50 border-indigo-100 text-indigo-800"
        : "bg-red-50 border-red-100 text-red-800";

  return (
    <Card>
      <CardHeader
        title="Wellbeing Stats"
        subtitle="Derived from your learning behaviour"
      />
      <div className="space-y-5">
        {/* Energy */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Zap size={15} className="text-yellow-500" /> Energy Level
            </div>
            <span className="text-sm font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded-lg">
              {state.energy}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-700"
              style={{ width: `${state.energy}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            {energyDesc}
          </p>
          <div className={`border rounded-xl px-3 py-2.5 ${energyBox}`}>
            <p className="text-xs font-bold mb-0.5">💡 {energyTip}</p>
            <p className="text-xs opacity-80">🎯 Recommended: {energyAction}</p>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Balance */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Scale size={15} className="text-blue-500" /> Life Balance
            </div>
            <span className="text-sm font-bold text-gray-800 bg-gray-50 px-2 py-1 rounded-lg">
              {state.balance}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all duration-700"
              style={{ width: `${state.balance}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            {balanceDesc}
          </p>
          <div className={`border rounded-xl px-3 py-2.5 ${balanceBox}`}>
            <p className="text-xs font-bold mb-0.5">💡 {balanceTip}</p>
            <p className="text-xs opacity-80">
              🎯 Recommended: {balanceAction}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// MONTHLY STRESS & FOCUS CHART - FULL WIDTH, CLEAN
// ─────────────────────────────────────────────
function MonthlyTrendCard({
  state,
}: {
  state: ReturnType<typeof deriveWellbeingState>;
}) {
  // Generate 30 days of data (or use real data if available)
  const daysInMonth = 30;
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (daysInMonth - 1 - i));
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  // Generate realistic monthly stress/focus data based on weekly trends
  const monthlyStress = useMemo(() => {
    const basePattern = state.weeklyStress.filter((v) => v > 0);
    if (basePattern.length === 0) basePattern.push(50);

    const result = [];
    for (let i = 0; i < daysInMonth; i++) {
      const weekPhase = Math.floor(i / 7);
      let value = basePattern[weekPhase % basePattern.length] || 50;
      // Add daily variation
      value += Math.sin(i * 0.5) * 5 + (Math.random() * 8 - 4);
      result.push(Math.min(100, Math.max(15, Math.round(value))));
    }
    return result;
  }, [state.weeklyStress]);

  const monthlyFocus = useMemo(() => {
    const basePattern = state.weeklyFocus.filter((v) => v > 0);
    if (basePattern.length === 0) basePattern.push(65);

    const result = [];
    for (let i = 0; i < daysInMonth; i++) {
      const weekPhase = Math.floor(i / 7);
      let value = basePattern[weekPhase % basePattern.length] || 65;
      // Focus declines with stress
      value -= (monthlyStress[i] - 50) * 0.3;
      value += Math.sin(i * 0.3) * 4;
      result.push(Math.min(95, Math.max(20, Math.round(value))));
    }
    return result;
  }, [state.weeklyFocus, monthlyStress]);

  // Chart dimensions - USE FULL WIDTH
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);

  useEffect(() => {
    if (chartRef.current) {
      setChartWidth(chartRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (chartRef.current) setChartWidth(chartRef.current.offsetWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const CHART_H = 180;
  const PADDING_LEFT = 35;
  const PADDING_RIGHT = 20;
  const PADDING_TOP = 15;
  const PADDING_BOTTOM = 25;
  const PLOT_WIDTH = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const PLOT_HEIGHT = CHART_H - PADDING_TOP - PADDING_BOTTOM;

  // Show every 5th day label to avoid clutter
  const visibleLabels = [0, 4, 9, 14, 19, 24, 29];

  const TrendIcon =
    state.stressTrend === "lower"
      ? TrendingDown
      : state.stressTrend === "stable"
        ? Minus
        : TrendingUp;
  const trendColor =
    state.stressTrend === "lower"
      ? "text-green-500"
      : state.stressTrend === "stable"
        ? "text-yellow-500"
        : "text-red-500";
  const trendLabel =
    state.stressTrend === "highest_week"
      ? "Highest stress this week 🔴"
      : state.stressTrend === "much_higher"
        ? "Stress spiked significantly ↑"
        : state.stressTrend === "higher"
          ? "Higher than yesterday"
          : state.stressTrend === "lower"
            ? "Improving from yesterday ✓"
            : "Stable this week";

  return (
    <Card>
      <CardHeader
        title="Monthly Stress & Focus Trend"
        subtitle={`Last ${daysInMonth} days · Based on your learning patterns`}
      />

      <div ref={chartRef} className="w-full">
        <svg
          width={chartWidth}
          height={CHART_H + 40}
          viewBox={`0 0 ${chartWidth} ${CHART_H + 40}`}
          style={{ display: "block", width: "100%", height: "auto" }}
        >
          {/* Y-axis grid lines with proper spacing */}
          {[0, 25, 50, 75, 100].map((v) => {
            const y = PADDING_TOP + PLOT_HEIGHT - (v / 100) * PLOT_HEIGHT;
            return (
              <g key={v}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={chartWidth - PADDING_RIGHT}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={PADDING_LEFT - 8}
                  y={y + 3}
                  fontSize="10"
                  fill="#9ca3af"
                  textAnchor="end"
                  className="text-[10px]"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Y-axis line */}
          <line
            x1={PADDING_LEFT}
            y1={PADDING_TOP}
            x2={PADDING_LEFT}
            y2={PADDING_TOP + PLOT_HEIGHT}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* X-axis line */}
          <line
            x1={PADDING_LEFT}
            y1={PADDING_TOP + PLOT_HEIGHT}
            x2={chartWidth - PADDING_RIGHT}
            y2={PADDING_TOP + PLOT_HEIGHT}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Stress area (semi-transparent fill) */}
          {/*
          <path
            d={`
              M ${PADDING_LEFT} ${PADDING_TOP + PLOT_HEIGHT}
              ${monthlyStress
                .map((value, i) => {
                  const x = PADDING_LEFT + (i / (daysInMonth - 1)) * PLOT_WIDTH;
                  const y =
                    PADDING_TOP + PLOT_HEIGHT - (value / 100) * PLOT_HEIGHT;
                  return `L ${x} ${y}`;
                })
                .join(" ")}
              L ${chartWidth - PADDING_RIGHT} ${PADDING_TOP + PLOT_HEIGHT}
              Z
            `}
            fill="#fef2f2"
            opacity="0.5"
          />  */}

          {/* Stress line */}
          <path
            d={monthlyStress
              .map((value, i) => {
                const x = PADDING_LEFT + (i / (daysInMonth - 1)) * PLOT_WIDTH;
                const y =
                  PADDING_TOP + PLOT_HEIGHT - (value / 100) * PLOT_HEIGHT;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Focus line */}
          <path
            d={monthlyFocus
              .map((value, i) => {
                const x = PADDING_LEFT + (i / (daysInMonth - 1)) * PLOT_WIDTH;
                const y =
                  PADDING_TOP + PLOT_HEIGHT - (value / 100) * PLOT_HEIGHT;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X-axis labels (every 5th day) */}
          {visibleLabels.map((dayIndex) => {
            const x =
              PADDING_LEFT + (dayIndex / (daysInMonth - 1)) * PLOT_WIDTH;
            return (
              <g key={dayIndex}>
                <line
                  x1={x}
                  y1={PADDING_TOP + PLOT_HEIGHT}
                  x2={x}
                  y2={PADDING_TOP + PLOT_HEIGHT + 4}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={PADDING_TOP + PLOT_HEIGHT + 18}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#9ca3af"
                  className="text-[9px]"
                >
                  {days[dayIndex]}
                </text>
              </g>
            );
          })}

          {/* Data points for stress (sparse to avoid clutter) */}
          {monthlyStress.map((value, i) => {
            if (i % 5 !== 0 && i !== daysInMonth - 1) return null;
            const x = PADDING_LEFT + (i / (daysInMonth - 1)) * PLOT_WIDTH;
            const y = PADDING_TOP + PLOT_HEIGHT - (value / 100) * PLOT_HEIGHT;
            return (
              <circle
                key={`stress-dot-${i}`}
                cx={x}
                cy={y}
                r="3"
                fill="#ef4444"
                stroke="white"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Data points for focus (sparse to avoid clutter) */}
          {monthlyFocus.map((value, i) => {
            if (i % 5 !== 0 && i !== daysInMonth - 1) return null;
            const x = PADDING_LEFT + (i / (daysInMonth - 1)) * PLOT_WIDTH;
            const y = PADDING_TOP + PLOT_HEIGHT - (value / 100) * PLOT_HEIGHT;
            return (
              <circle
                key={`focus-dot-${i}`}
                cx={x}
                cy={y}
                r="3"
                fill="#a78bfa"
                stroke="white"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Legend and stats below chart */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600">Stress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-xs text-gray-600">Focus</span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${trendColor}`}
        >
          <TrendIcon size={12} />
          <span>{trendLabel}</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mt-3 pt-2">
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Avg Stress</p>
          <p className="text-sm font-bold text-red-600">
            {Math.round(
              monthlyStress.reduce((a, b) => a + b, 0) / monthlyStress.length,
            )}
            %
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Peak Stress Day</p>
          <p className="text-sm font-bold text-red-600">
            {Math.max(...monthlyStress)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400">Lowest Focus</p>
          <p className="text-sm font-bold text-violet-600">
            {Math.min(...monthlyFocus)}%
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// FOCUS DROP DETECTOR
// ─────────────────────────────────────────────
function FocusDropCard({
  state,
  ls,
}: {
  state: ReturnType<typeof deriveWellbeingState>;
  ls: Scenario;
}) {
  const preferred = 45;
  const dangerMax = preferred * 1.6;
  const dropDetected = ls.sessionDuration > preferred;
  const dropAmount = Math.max(0, ls.sessionDuration - preferred);
  const focusLossEst = Math.round(dropAmount * 0.65);

  // Session bar: how far through the danger zone (0 → dangerMax)
  const sessionBarPct = Math.min(
    Math.round((ls.sessionDuration / dangerMax) * 100),
    100,
  );
  // Focus bar: directly the focus score
  const focusBarPct = state.focusScore;

  const focusBarColor =
    state.focusScore >= 68
      ? "bg-violet-400"
      : state.focusScore >= 46
        ? "bg-yellow-400"
        : "bg-red-400";

  return (
    <Card
      className={`border ${dropDetected ? "border-orange-200 bg-orange-50/20" : "border-gray-200"}`}
    >
      <CardHeader
        title="Focus Drop Detector"
        subtitle={
          dropDetected
            ? "⚠ Focus degradation active"
            : "✓ Within optimal window"
        }
      />
      <div className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-xl p-2">
            <p className="text-[10px] text-gray-400 mb-0.5">Session</p>
            <p
              className={`text-sm font-black ${dropDetected ? "text-orange-600" : "text-green-600"}`}
            >
              {ls.sessionDuration}m
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2">
            <p className="text-[10px] text-gray-400 mb-0.5">Optimal</p>
            <p className="text-sm font-black text-gray-700">{preferred}m</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2">
            <p className="text-[10px] text-gray-400 mb-0.5">Focus</p>
            <p
              className={`text-sm font-black ${state.focusScore >= 68 ? "text-violet-600" : state.focusScore >= 46 ? "text-yellow-600" : "text-red-600"}`}
            >
              {state.focusScore}%
            </p>
          </div>
        </div>

        {/* Session length bar */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span className="font-semibold">Session length</span>
            <span>
              {ls.sessionDuration} / {Math.round(dangerMax)} min
            </span>
          </div>
          <div className="relative w-full bg-gray-100 rounded-full h-2.5">
            {/* Optimal marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-green-400 rounded-full z-10"
              style={{ left: `${(preferred / dangerMax) * 100}%` }}
            />
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${dropDetected ? "bg-orange-400" : "bg-green-400"}`}
              style={{ width: `${sessionBarPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-gray-300 mt-0.5">
            <span>0</span>
            <span className="text-green-500">↑ Optimal ({preferred}m)</span>
            <span>Max ({Math.round(dangerMax)}m)</span>
          </div>
        </div>

        {/* Focus score bar */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span className="font-semibold">Current focus level</span>
            <span>{focusBarPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${focusBarColor}`}
              style={{ width: `${focusBarPct}%` }}
            />
          </div>
        </div>

        {/* Alert / OK message */}
        {dropDetected ? (
          <div className="bg-orange-100 border border-orange-200 rounded-xl p-3">
            <p className="text-xs font-bold text-orange-800 mb-1">
              ⚡ {dropAmount} min past optimal — est. {focusLossEst}% focus lost
            </p>
            <p className="text-xs text-orange-700">
              You perform best under {preferred} min. Beyond this, retention
              drops and errors increase.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-xs font-bold text-green-800">
              ✓ Within your optimal session window.
            </p>
            <p className="text-xs text-green-700">
              ~{preferred - ls.sessionDuration} minutes remaining before focus
              starts to dip.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// LEARNING STRESS
// ─────────────────────────────────────────────
function LearningStressCard({ stress, ls }: { stress: string; ls: Scenario }) {
  const rec = getModuleRecommendation(stress, ls.currentModule);
  const stressColor =
    stress === "Low"
      ? "text-green-600 bg-green-50 border-green-100"
      : stress === "High"
        ? "text-red-600 bg-red-50 border-red-100"
        : "text-yellow-600 bg-yellow-50 border-yellow-100";
  const recBg =
    rec.type === "switch"
      ? "bg-red-50 border-red-100"
      : rec.type === "ease"
        ? "bg-yellow-50 border-yellow-100"
        : "bg-green-50 border-green-100";
  const recText =
    rec.type === "switch"
      ? "text-red-800"
      : rec.type === "ease"
        ? "text-yellow-800"
        : "text-green-800";

  return (
    <Card>
      <CardHeader
        title="Learning Stress"
        subtitle={`${ls.currentModule} · Session ${ls.sessionsToday}`}
      />
      <div
        className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-flex mb-3 ${stressColor}`}
      >
        {stress} Stress
      </div>
      <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1">
        <p className="text-xs text-gray-600 flex items-center gap-1.5">
          <Clock size={11} className="text-purple-400" /> {ls.sessionDuration}{" "}
          min session · {ls.lastBreak} min since break
        </p>
        <p className="text-xs text-gray-600 flex items-center gap-1.5">
          <RefreshCw size={11} className="text-orange-400" /> {ls.attemptCount}{" "}
          attempt{ls.attemptCount !== 1 ? "s" : ""} on this module
        </p>
      </div>
      <div className={`border rounded-xl p-3 ${recBg}`}>
        <p className={`text-xs font-bold mb-1 ${recText}`}>
          {rec.type === "switch"
            ? "🔄 Adaptive Path Adjusted"
            : rec.type === "ease"
              ? "⚡ Ease Recommended"
              : "✅ Continue as Planned"}
        </p>
        <p className={`text-xs ${recText} mb-2`}>{rec.message}</p>
        <div className="flex items-center gap-2 bg-white/60 rounded-lg px-2.5 py-2">
          <span className="text-base">{rec.module.emoji}</span>
          <div>
            <p className={`text-xs font-bold ${recText}`}>{rec.module.name}</p>
            <p className="text-[10px] text-gray-500 capitalize">
              {rec.module.load} cognitive load
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <BookOpen size={12} /> Adaptive path based on session behaviour
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// AI INSIGHTS — mixed badge colors
// ─────────────────────────────────────────────
function AIInsightCard({
  state,
  ls,
}: {
  state: ReturnType<typeof deriveWellbeingState>;
  ls: Scenario;
}) {
  const insight = generateInsight(state, ls);

  // Each badge uses its own dimension's status — naturally mixed
  const moodStatus = getStatusType(state.emotion);
  const stressStatus = getStatusType(state.stress);
  const focusStatus = getStatusType(state.focus);
  const energyStatus: StatusType =
    state.energy >= 70 ? "processed" : state.energy >= 50 ? "pending" : "error";
  const balanceStatus: StatusType =
    state.balance >= 70
      ? "processed"
      : state.balance >= 50
        ? "pending"
        : "error";

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
        <Brain size={90} className="text-[#8B5CF6]" />
      </div>
      <h4 className="flex items-center gap-2 text-xs font-black text-[#8B5CF6] mb-3">
        🤖 AI Care Insight
      </h4>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <Brain size={16} className="text-[#8B5CF6]" />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">
              Why this is happening
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {insight.reason}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider mb-0.5">
              Recommended action
            </p>
            <p className="text-sm text-purple-800 font-medium leading-relaxed">
              {insight.action}
            </p>
          </div>
        </div>
      </div>

      {insight.allReasons.length > 1 && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <p className="text-[10px] font-black text-gray-500 uppercase mb-2">
            All detected patterns
          </p>
          <ul className="space-y-1">
            {insight.allReasons.slice(1).map((r, i) => (
              <li
                key={i}
                className="text-xs text-gray-600 flex items-start gap-1.5"
              >
                <AlertTriangle
                  size={10}
                  className="text-orange-400 mt-0.5 shrink-0"
                />{" "}
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Each badge is independently colored */}
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={moodStatus} label={`Mood: ${state.emotion}`} />
        <StatusBadge status={stressStatus} label={`Stress: ${state.stress}`} />
        <StatusBadge status={focusStatus} label={`Focus: ${state.focus}`} />
        <StatusBadge status={energyStatus} label={`Energy: ${state.energy}%`} />
        <StatusBadge
          status={balanceStatus}
          label={`Balance: ${state.balance}%`}
        />
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────
function CareChat({
  state,
  ls,
}: {
  state: ReturnType<typeof deriveWellbeingState>;
  ls: Scenario;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSimulatingChat, setIsSimulatingChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]); // Start with empty array, we'll add greeting when chat opens
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Add greeting when chat first opens
  useEffect(() => {
    if (isChatOpen && chatMessages.length === 0) {
      const greeting = getGreeting(state, ls);
      setChatMessages([{ role: "assistant", text: greeting }]);
    }
  }, [isChatOpen, state, ls, chatMessages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isSimulatingChat]);

  const systemPrompt = `You are Carely, a warm and empathetic AI wellbeing companion integrated into a student learning platform.

The student's current learning and wellbeing data:
- Current module: ${ls.currentModule}
- Session duration: ${ls.sessionDuration} minutes
- Sessions today: ${ls.sessionsToday}
- Last break: ${ls.lastBreak} minutes ago
- Module attempt count: ${ls.attemptCount}
- Emotion: ${state.emotion} | Stress: ${state.stress} (${state.stressScore}/100) | Focus: ${state.focus} (${state.focusScore}/100)
- Energy: ${state.energy}% | Life Balance: ${state.balance}%
- Stress trend: ${state.stressTrend} | Focus trend: ${state.focusTrend}

Reference specific numbers and module names when relevant. Be concrete, not generic. Keep responses to 2–4 sentences. Occasional emojis. Never give medical advice.`;

  return (
    <>
      <AnimatePresence>
        {isChatOpen ? (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed top-0 bottom-0 right-0 w-80 lg:w-96 h-screen bg-white border-l border-gray-200 shadow-2xl z-[100] flex flex-col overflow-hidden"
          >
            <div className="bg-[#8B5CF6] p-4 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white p-0.5 rounded-full shadow-md relative shrink-0">
                  <img
                    src="/images/avatars/hadri.png"
                    alt="Carely"
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
                <div className="flex flex-col items-start">
                  <h3
                    style={{ color: "white" }}
                    className="font-black text-[18px] leading-tight flex items-center gap-2 ml-1"
                  >
                    Carely{" "}
                    <span className="px-1.5 py-0.5 bg-white text-purple-700 rounded-md text-[9px] uppercase tracking-widest font-black shadow-sm">
                      AI
                    </span>
                  </h3>
                  <p
                    style={{ color: "white" }}
                    className="text-[11px] font-medium tracking-wide opacity-90 ml-2"
                  >
                    Wellbeing Companion
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-5 pt-8 overflow-y-auto bg-[#F8FAFC] flex flex-col gap-5">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && idx > 0 && (
                    <img
                      src="/images/avatars/hadri.png"
                      alt="Carely"
                      className="w-6 h-6 rounded-full mr-2 self-end mb-1 opacity-80 object-cover"
                    />
                  )}
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[14px] leading-relaxed ${msg.role === "user" ? "bg-[#8B5CF6] text-white rounded-br-sm shadow-sm" : "bg-[#F1F5F9] text-gray-800 rounded-bl-sm"}`}
                  >
                    <div
                      className={`prose prose-sm max-w-none break-words ${msg.role === "user" ? "text-white prose-invert" : "text-gray-800"}`}
                    >
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isSimulatingChat && (
                <div className="flex justify-start">
                  <img
                    src="/images/avatars/hadri.png"
                    alt="Carely"
                    className="w-6 h-6 rounded-full self-end mb-1 opacity-80 object-cover mr-2"
                  />
                  <div className="max-w-[85%] p-3.5 rounded-2xl rounded-bl-sm bg-[#F1F5F9] flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!chatInput.trim() || isSimulatingChat) return;
                  const currentInput = chatInput;

                  // Filter out the initial assistant greeting from history
                  // because Gemini expects first message to be from user
                  const historyForAPI = chatMessages.filter((msg, index) => {
                    // Remove the very first assistant greeting message
                    if (index === 0 && msg.role === "assistant") return false;
                    return true;
                  });

                  const currentHistory = [
                    ...historyForAPI,
                    { role: "user" as const, text: currentInput },
                  ];

                  setChatMessages((prev) => [
                    ...prev,
                    { role: "user", text: currentInput },
                  ]);
                  setChatInput("");
                  setIsSimulatingChat(true);
                  try {
                    const response = await fetch("/api/chat/carely", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        message: currentInput,
                        history: currentHistory,
                      }),
                    });

                    if (!response.ok) {
                      throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    console.log("CARELY RESPONSE RAW:", data);

                    let reply = "I'm here for you. Tell me more 🌿";

                    if (data.text) {
                      reply = data.text;
                    } else if (data.response) {
                      reply = data.response;
                    } else if (data.message) {
                      reply = data.message;
                    } else if (
                      data.content &&
                      Array.isArray(data.content) &&
                      data.content[0]?.text
                    ) {
                      reply = data.content[0].text;
                    }

                    setChatMessages((prev) => [
                      ...prev,
                      { role: "assistant", text: reply },
                    ]);
                  } catch (err: unknown) {
                    console.error("CARESPACE CHAT ERROR:", err);
                    setChatMessages((prev) => [
                      ...prev,
                      {
                        role: "assistant",
                        text: `Sorry, I'm having trouble connecting. Please try again.`,
                      },
                    ]);
                  } finally {
                    setIsSimulatingChat(false);
                  }
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Talk to Carely about how you feel..."
                  className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 hover:border-violet-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSimulatingChat}
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#8B5CF6] text-white w-10 rounded-full flex items-center justify-center hover:bg-violet-700 transition disabled:opacity-50"
                >
                  <Send
                    size={16}
                    className={isSimulatingChat ? "animate-pulse" : ""}
                  />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-[#8B5CF6] rounded-full shadow-[0_10px_25px_rgba(147,51,234,0.4)] flex items-center justify-center z-[100] border-4 border-white group transition-transform"
          >
            <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            <img
              src="/images/avatars/hadri.png"
              alt="Carely"
              className="w-full h-full rounded-full object-cover transition-opacity group-hover:opacity-0"
            />
            <MessageCircle
              className="text-white absolute transition-opacity opacity-0 group-hover:opacity-100"
              size={26}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────
// MAIN — scenario generated once on mount
// ─────────────────────────────────────────────
export default function CareSpacePage() {
  const [isMounted, setIsMounted] = useState(false);

  // Generate scenario only on client side to prevent hydration mismatch
  const ls = useMemo(() => {
    if (!isMounted) return null;
    return generateScenario();
  }, [isMounted]);

  const state = useMemo(() => {
    if (!ls) return null;
    return deriveWellbeingState(ls);
  }, [ls]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading during SSR/hydration
  if (!isMounted || !ls || !state) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your wellbeing dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <CareHero state={state} ls={ls} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 mt-6 pb-10">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MoodCard />
          <WellbeingStats state={state} ls={ls} />
          <MonthlyTrendCard state={state} />
        </div>
        <div className="flex flex-col gap-6">
          <FocusDropCard state={state} ls={ls} />
          <LearningStressCard stress={state.stress} ls={ls} />
          <AIInsightCard state={state} ls={ls} />
        </div>
      </div>

      <CareChat state={state} ls={ls} />
    </main>
  );
}
