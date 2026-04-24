"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Send,
  X,
  MessageCircle,
  Zap,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";

// ─────────────────────────────────────────────
// AI summary (kept minimal)
// ─────────────────────────────────────────────
const modulePool = [
  "Detection System Module",
  "Module 2: Data Basics",
  "Module 3: Core Practicals",
  "Module 4: Advanced Concepts",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type Summary = {
  moduleName: string;
  minutes: number;
  lastBreak: number;
  sessionsToday: number;
  attemptCount: number;
  tone: "gentle" | "neutral" | "bright";
  sentence: string;
  // derived wellbeing
  energy: number;
  balance: number;
  focusScore: number;
  stressScore: number;
  stress: "Low" | "Moderate" | "High";
  focus: "Sharp" | "Okay" | "Distracted";
  emotion: "Happy" | "Neutral" | "Stressed";
  stressTrend: "highest_week" | "much_higher" | "higher" | "stable" | "lower";
  monthlyStress: number[];
  monthlyFocus: number[];
  insight: string;
  action: string;
  preferred: number;
};

function buildSummary(): Summary {
  const moduleName = modulePool[randInt(0, modulePool.length - 1)];
  const minutes = randInt(18, 86);
  const lastBreak = randInt(12, 120);
  const sessionsToday = randInt(1, 5);
  const attemptCount = randInt(1, 6);
  const preferred = 45;

  // stress
  let stressScore = 20;
  if (minutes > 60) stressScore += 20;
  if (minutes > 85) stressScore += 12;
  if (sessionsToday >= 3) stressScore += 16;
  if (lastBreak > 60) stressScore += 14;
  if (lastBreak > 90) stressScore += 10;
  if (attemptCount >= 3) stressScore += 10;
  if (attemptCount >= 5) stressScore += 8;
  stressScore = Math.min(Math.round(stressScore + randInt(-5, 5)), 100);

  // focus
  let focusScore = 90;
  if (minutes > preferred) focusScore -= (minutes - preferred) * 0.65;
  if (lastBreak > 50) focusScore -= 16;
  if (sessionsToday >= 3) focusScore -= 10;
  if (attemptCount >= 4) focusScore -= 8;
  focusScore = Math.max(Math.min(Math.round(focusScore + randInt(-6, 6)), 100), 12);

  // energy + balance
  const energy = Math.max(
    Math.round(100 - minutes * 0.4 - sessionsToday * 8 + randInt(-5, 5)),
    18,
  );
  const balance = Math.max(
    Math.round(95 - lastBreak * 0.25 - sessionsToday * 5 + randInt(-5, 5)),
    18,
  );

  const stress: Summary["stress"] =
    stressScore >= 65 ? "High" : stressScore >= 38 ? "Moderate" : "Low";
  const focus: Summary["focus"] =
    focusScore >= 68 ? "Sharp" : focusScore >= 46 ? "Okay" : "Distracted";
  const emotionBlend = stressScore * 0.6 + (100 - energy) * 0.4;
  const emotion: Summary["emotion"] =
    emotionBlend >= 62 ? "Stressed" : emotionBlend >= 38 ? "Neutral" : "Happy";

  // monthly trends — 30 synthetic points
  const monthlyStress: number[] = [];
  const monthlyFocus: number[] = [];
  for (let i = 0; i < 30; i++) {
    const baseS = stressScore + Math.sin(i * 0.3) * 10;
    const baseF = focusScore + Math.sin(i * 0.25 + 1) * 12;
    monthlyStress.push(
      Math.min(95, Math.max(15, Math.round(baseS + randInt(-10, 10)))),
    );
    monthlyFocus.push(
      Math.min(95, Math.max(20, Math.round(baseF + randInt(-10, 10)))),
    );
  }
  const todayS = monthlyStress[29];
  const yest = monthlyStress[28];
  const maxS = Math.max(...monthlyStress);
  const stressTrend: Summary["stressTrend"] =
    todayS === maxS && todayS > yest + 3
      ? "highest_week"
      : todayS > yest + 10
        ? "much_higher"
        : todayS > yest + 3
          ? "higher"
          : todayS < yest - 3
            ? "lower"
            : "stable";

  // top sentence + insight
  let tone: Summary["tone"] = "neutral";
  let sentence = "";
  if (minutes >= 60 || lastBreak >= 75) {
    tone = "gentle";
    sentence = `You've been on ${moduleName} for ${minutes} min, a soft pause might help.`;
  } else if (minutes <= 30 && lastBreak <= 30) {
    tone = "bright";
    sentence = `Nice rhythm on ${moduleName} — you're pacing yourself well.`;
  } else {
    sentence = `${minutes} min into ${moduleName} · ${lastBreak} min since your last break.`;
  }

  // compact insight
  let insight = `Pacing looks balanced on ${moduleName}.`;
  let action = "Keep sessions under 45 min.";
  if (minutes > preferred) {
    insight = `${minutes - preferred} min past your ${preferred}-min focus window.`;
    action = `Pause ${moduleName} and take a 15-min break.`;
  } else if (lastBreak > 60) {
    insight = `Last break was ${lastBreak} min ago - cognitive fatigue is building.`;
    action = "Step away for at least 10 min.";
  } else if (attemptCount >= 3) {
    insight = `${attemptCount} attempts on this module — repeated struggle raises stress.`;
    action = "Switch to a lighter module and revisit tomorrow.";
  } else if (stressTrend === "highest_week") {
    insight = "Today is your most stressed session of the week.";
    action = "Avoid starting new modules today.";
  } else if (stress === "Low" && focus === "Sharp") {
    insight = "You're in a strong cognitive state right now.";
    action = `Tackle the hardest part of ${moduleName} while this lasts.`;
  }

  return {
    moduleName,
    minutes,
    lastBreak,
    sessionsToday,
    attemptCount,
    tone,
    sentence,
    energy,
    balance,
    focusScore,
    stressScore,
    stress,
    focus,
    emotion,
    stressTrend,
    monthlyStress,
    monthlyFocus,
    insight,
    action,
    preferred,
  };
}

// ─────────────────────────────────────────────
// Mood picker
// ─────────────────────────────────────────────
type Mood = "good" | "okay" | "low";
const MOODS: { id: Mood; emoji: string; label: string; color: string }[] = [
  { id: "good", emoji: "😊", label: "Feeling good", color: "from-amber-200 to-rose-200" },
  { id: "okay", emoji: "😐", label: "Feeling okay", color: "from-emerald-200 to-sky-200" },
  { id: "low", emoji: "😔", label: "Feeling not great", color: "from-indigo-200 to-violet-200" },
];

// ─────────────────────────────────────────────
// Web Audio — soft tones (no external files)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Fullscreen toggle for game containers
// ─────────────────────────────────────────────
function useFullscreen(ref: React.RefObject<HTMLElement | null>) {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const handler = () => setIsFull(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [ref]);

  const toggle = useCallback(async () => {
    if (!ref.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await ref.current.requestFullscreen();
      }
    } catch {
      /* user cancelled or unsupported */
    }
  }, [ref]);

  return { isFull, toggle };
}

function useSoftSynth() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const ensure = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, { duration = 1.6, type = "sine" as OscillatorType } = {}) => {
      const ctx = ensure();
      if (!ctx || !masterRef.current) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;

      // soft sub-sine for body
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.value = freq / 2;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      filter.Q.value = 0.7;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.5, now + 0.04);
      env.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const subGain = ctx.createGain();
      subGain.gain.value = 0.25;

      osc.connect(env);
      sub.connect(subGain).connect(env);
      env.connect(filter).connect(masterRef.current);

      osc.start(now);
      sub.start(now);
      osc.stop(now + duration + 0.05);
      sub.stop(now + duration + 0.05);
    },
    [ensure],
  );

  const playPurr = useCallback(() => {
    const ctx = ensure();
    if (!ctx || !masterRef.current) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 28;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 22;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 14;
    lfo.connect(lfoGain).connect(osc.frequency);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.3);
    g.gain.linearRampToValueAtTime(0.0, now + 2.2);
    osc.connect(filter).connect(g).connect(masterRef.current);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 2.3);
    lfo.stop(now + 2.3);
  }, [ensure]);

  const playSynthMeow = useCallback(() => {
    const ctx = ensure();
    if (!ctx || !masterRef.current) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.55);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 700;
    filt.Q.value = 2;
    osc.connect(filt).connect(g).connect(masterRef.current);
    osc.start(now);
    osc.stop(now + 0.7);
  }, [ensure]);

  // Prefer the real sample at /sounds/meow.mp3; fall back to the synth.
  const meowAudioRef = useRef<HTMLAudioElement | null>(null);
  const meowAvailableRef = useRef<boolean | null>(null);

  const playMeow = useCallback(() => {
    if (typeof window === "undefined") return;
    if (meowAvailableRef.current === false) {
      playSynthMeow();
      return;
    }
    if (!meowAudioRef.current) {
      const audio = new Audio("/sounds/meow.mp3");
      audio.preload = "auto";
      audio.volume = 0.9;
      audio.addEventListener("error", () => {
        meowAvailableRef.current = false;
        playSynthMeow();
      });
      meowAudioRef.current = audio;
    }
    try {
      const a = meowAudioRef.current;
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          meowAvailableRef.current = true;
        }).catch(() => {
          meowAvailableRef.current = false;
          playSynthMeow();
        });
      }
    } catch {
      meowAvailableRef.current = false;
      playSynthMeow();
    }
  }, [playSynthMeow]);

  return { playTone, playPurr, playMeow };
}

// ─────────────────────────────────────────────
// Bubble Pop
// ─────────────────────────────────────────────
type Bubble = {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  freq: number;
  hue: number;
};

const PENTATONIC = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99,
];

let bubbleCounter = 0;
function spawnBubble(): Bubble {
  return {
    id: ++bubbleCounter,
    x: Math.random() * 88 + 6,
    size: 44 + Math.random() * 70,
    duration: 9 + Math.random() * 7,
    delay: Math.random() * 0.8,
    freq: PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)],
    hue: 200 + Math.random() * 140,
  };
}

type PopFX = {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
};
let popCounter = 0;

function BubblePopGame({ onBack }: { onBack: () => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: 8 }, spawnBubble),
  );
  const [pops, setPops] = useState<PopFX[]>([]);
  const [popped, setPopped] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFull, toggle: toggleFull } = useFullscreen(containerRef);
  const { playTone } = useSoftSynth();

  useEffect(() => {
    const id = setInterval(() => {
      setBubbles((prev) => [...prev, spawnBubble()].slice(-14));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const pop = useCallback(
    (b: Bubble, e: React.MouseEvent<HTMLButtonElement>) => {
      playTone(b.freq, { duration: 1.4 });
      const bubbleRect = e.currentTarget.getBoundingClientRect();
      const parentRect = containerRef.current?.getBoundingClientRect();
      if (parentRect) {
        const popId = ++popCounter;
        const x = bubbleRect.left - parentRect.left + bubbleRect.width / 2;
        const y = bubbleRect.top - parentRect.top + bubbleRect.height / 2;
        setPops((prev) => [
          ...prev,
          { id: popId, x, y, size: b.size, hue: b.hue },
        ]);
        setTimeout(() => {
          setPops((prev) => prev.filter((p) => p.id !== popId));
        }, 700);
      }
      setBubbles((prev) => prev.filter((x) => x.id !== b.id));
      setPopped((n) => n + 1);
    },
    [playTone],
  );

  const remove = useCallback((id: number) => {
    setBubbles((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-sky-100 to-violet-100 shadow-inner ${
        isFull ? "h-screen rounded-none" : "h-[560px] rounded-3xl"
      }`}
    >
      {/* Soft glowing orbs in background */}
      <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/40 blur-3xl" />
      <div className="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-violet-200/50 blur-3xl" />

      {/* Pop splash effects */}
      {pops.map((p) => (
        <PopSplash key={p.id} pop={p} />
      ))}

      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur text-xs font-semibold text-gray-700 hover:bg-white transition"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur text-xs font-semibold text-violet-700">
            Popped · {popped}
          </div>
          <button
            onClick={toggleFull}
            title={isFull ? "Exit fullscreen" : "Fullscreen"}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/70 backdrop-blur text-gray-700 hover:bg-white transition"
          >
            {isFull ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/60 backdrop-blur px-3 py-1.5 rounded-full">
        Tap a bubble. Each one sings.
      </p>

      <AnimatePresence>
        {bubbles.map((b) => (
          <motion.button
            key={b.id}
            initial={{ y: 40, opacity: 0, scale: 0.6 }}
            animate={{ y: -620, opacity: [0, 1, 1, 0.9, 0], scale: 1 }}
            exit={{ scale: 1.7, opacity: 0, transition: { duration: 0.25 } }}
            transition={{
              duration: b.duration,
              delay: b.delay,
              ease: "easeOut",
            }}
            onAnimationComplete={() => remove(b.id)}
            onClick={(e) => pop(b, e)}
            style={{
              left: `${b.x}%`,
              width: b.size,
              height: b.size,
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), hsla(${b.hue},80%,75%,0.55) 55%, hsla(${b.hue},60%,60%,0.35) 100%)`,
              boxShadow: `inset -6px -8px 12px hsla(${b.hue},60%,60%,0.4), 0 4px 18px hsla(${b.hue},60%,60%,0.35)`,
            }}
            className="absolute bottom-0 rounded-full border border-white/60 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Cozy Meow
// ─────────────────────────────────────────────
function PopSplash({ pop: p }: { pop: PopFX }) {
  const droplets = 8;
  return (
    <>
      {/* Expanding ring */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0.85 }}
        animate={{ scale: 2.1, opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        style={{
          left: p.x - p.size / 2,
          top: p.y - p.size / 2,
          width: p.size,
          height: p.size,
          borderColor: `hsl(${p.hue},80%,72%)`,
        }}
        className="absolute rounded-full border-4 pointer-events-none z-10"
      />
      {/* Soft inner flash */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0.7 }}
        animate={{ scale: 1.4, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          left: p.x - p.size / 2,
          top: p.y - p.size / 2,
          width: p.size,
          height: p.size,
          background: `radial-gradient(circle, hsla(${p.hue},90%,80%,0.85), transparent 60%)`,
        }}
        className="absolute rounded-full pointer-events-none z-10"
      />
      {/* Flying droplets */}
      {Array.from({ length: droplets }).map((_, i) => {
        const angle = (i / droplets) * Math.PI * 2;
        const distance = p.size * 0.9 + Math.random() * 16;
        const dropSize = 6 + Math.random() * 6;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              left: p.x - dropSize / 2,
              top: p.y - dropSize / 2,
              width: dropSize,
              height: dropSize,
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), hsla(${p.hue},80%,70%,0.9))`,
              boxShadow: `0 0 8px hsla(${p.hue},80%,70%,0.6)`,
            }}
            className="absolute rounded-full pointer-events-none z-10"
          />
        );
      })}
    </>
  );
}

function CozyMeowGame({ onBack }: { onBack: () => void }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [yarn, setYarn] = useState({ x: 0, y: 0 });
  const [started, setStarted] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>(
    [],
  );
  const [catFacing, setCatFacing] = useState<1 | -1>(1);
  const heartIdRef = useRef(0);
  const yarnRef = useRef({ x: 0, y: 0 });
  const catPosRef = useRef({ x: 0, y: 0 });
  const { isFull, toggle: toggleFull } = useFullscreen(areaRef);
  const { playPurr, playMeow } = useSoftSynth();
  const catControls = useAnimation();

  useEffect(() => {
    yarnRef.current = yarn;
  }, [yarn]);

  // Jump loop — cat stays put, then leaps in an arc toward the yarn
  useEffect(() => {
    if (!started) return;
    let cancelled = false;

    // position cat in the centre of the area on first interaction
    const rect = areaRef.current?.getBoundingClientRect();
    if (rect && catPosRef.current.x === 0 && catPosRef.current.y === 0) {
      catPosRef.current = { x: rect.width / 2, y: rect.height * 0.72 };
      catControls.set({
        x: catPosRef.current.x,
        y: catPosRef.current.y,
        scaleY: 1,
      });
    }

    const loop = async () => {
      await new Promise((r) => setTimeout(r, 500));
      while (!cancelled) {
        const from = catPosRef.current;
        const to = yarnRef.current;
        const dist = Math.hypot(to.x - from.x, to.y - from.y);

        if (dist < 45) {
          // idle breathing + occasional tail-twitch vibe
          try {
            await catControls.start({
              scaleY: [1, 1.04, 1],
              scaleX: [1, 0.98, 1],
              transition: { duration: 1.1, ease: "easeInOut" },
            });
          } catch {
            /* cancelled */
          }
          continue;
        }

        // Single hop (shorter landing spot if the yarn is very far)
        const progress = dist > 240 ? 0.55 : 1;
        const hopTo = {
          x: from.x + (to.x - from.x) * progress,
          y: from.y + (to.y - from.y) * progress,
        };
        const direction: 1 | -1 = hopTo.x >= from.x ? 1 : -1;
        const midX = (from.x + hopTo.x) / 2;
        const jumpHeight = 80 + Math.random() * 35;
        const midY = Math.min(from.y, hopTo.y) - jumpHeight;
        const jumpDur = 0.45 + Math.random() * 0.15;

        setCatFacing(direction);

        try {
          // 1) Anticipation — crouch before the launch
          await catControls.start({
            scaleY: 0.76,
            scaleX: 1.12,
            transition: { duration: 0.13, ease: [0.4, 0, 0.2, 1] },
          });

          // 2) Launch + parabolic arc with gravity-like easing
          //    ascent = easeOut (decelerating), descent = easeIn (accelerating)
          await catControls.start({
            x: [from.x, midX, hopTo.x],
            y: [from.y, midY, hopTo.y],
            scaleY: [1.28, 1.02, 0.82],
            scaleX: [0.84, 1.0, 1.18],
            rotate: [direction * -5, direction * 2, 0],
            transition: {
              x: { duration: jumpDur, ease: "linear" },
              y: {
                duration: jumpDur,
                times: [0, 0.5, 1],
                ease: ["easeOut", "easeIn"],
              },
              scaleY: { duration: jumpDur, times: [0, 0.55, 1] },
              scaleX: { duration: jumpDur, times: [0, 0.55, 1] },
              rotate: { duration: jumpDur, times: [0, 0.55, 1] },
            },
          });

          // 3) Landing recovery — squash then gentle overshoot back to rest
          await catControls.start({
            scaleY: [0.82, 1.08, 0.97, 1],
            scaleX: [1.18, 0.94, 1.02, 1],
            rotate: [0, direction * -1.5, 0],
            transition: {
              duration: 0.32,
              times: [0, 0.4, 0.75, 1],
              ease: "easeOut",
            },
          });
        } catch {
          /* cancelled */
        }

        if (cancelled) return;
        catPosRef.current = hopTo;

        // landing heart burst
        const hid = ++heartIdRef.current;
        setHearts((hh) => [
          ...hh,
          { id: hid, x: hopTo.x, y: hopTo.y - 30 },
        ]);
        setTimeout(
          () => setHearts((hh) => hh.filter((it) => it.id !== hid)),
          1200,
        );

        await new Promise((r) => setTimeout(r, 200 + Math.random() * 450));
      }
    };

    loop();
    return () => {
      cancelled = true;
    };
  }, [started, catControls]);

  // occasional purr
  useEffect(() => {
    const id = setInterval(() => {
      if (started) playPurr();
    }, 6000);
    return () => clearInterval(id);
  }, [started, playPurr]);

  const handleMove = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setYarn({ x, y });
    if (!started) setStarted(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    playMeow();
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const id = ++heartIdRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHearts((h) => [...h, { id, x, y }]);
    setTimeout(() => setHearts((h) => h.filter((it) => it.id !== id)), 1400);
  };

  return (
    <div
      ref={areaRef}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) handleMove(t.clientX, t.clientY);
      }}
      onClick={handleClick}
      className={`relative w-full overflow-hidden shadow-inner cursor-none ${
        isFull ? "h-screen rounded-none" : "h-[560px] rounded-3xl"
      }`}
      style={{
        background:
          "linear-gradient(180deg,#cfe8ff 0%,#dff3ff 30%,#ffecc8 62%,#f5e8bf 72%,#c2e2a9 78%,#8fce82 100%)",
      }}
    >
      {/* ── Garden scene ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sun */}
        <div
          className="absolute top-6 right-10 w-16 h-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle,#fff9c6 0%,#ffdf80 60%,#ffb84d 100%)",
            boxShadow:
              "0 0 44px rgba(255,220,130,0.55),0 0 90px rgba(255,200,80,0.3)",
          }}
        />
        {/* Sunbeams — subtle */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <div
            key={deg}
            className="absolute top-10 right-14 w-14 h-0.5 bg-yellow-200/40 rounded-full"
            style={{
              transform: `rotate(${deg}deg) translateX(22px)`,
              transformOrigin: "0 50%",
            }}
          />
        ))}

        {/* Clouds */}
        {[
          { left: 8, top: 9, w: 96, h: 28 },
          { left: 48, top: 5, w: 130, h: 34 },
          { left: 22, top: 18, w: 74, h: 22 },
          { left: 76, top: 20, w: 86, h: 24 },
        ].map((c, i) => (
          <div
            key={`cloud-${i}`}
            className="absolute bg-white/85 rounded-full blur-[2px]"
            style={{
              left: `${c.left}%`,
              top: `${c.top}%`,
              width: c.w,
              height: c.h,
            }}
          />
        ))}

        {/* Distant hills — layer 1 (pale) */}
        <svg
          className="absolute left-0 right-0 w-full"
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          style={{ bottom: "30%", height: 96 }}
        >
          <path
            d="M0 50 Q60 10 130 38 T260 32 T400 42 L400 80 L0 80 Z"
            fill="#b7dcb4"
            opacity="0.7"
          />
        </svg>
        {/* Distant hills — layer 2 (deeper) */}
        <svg
          className="absolute left-0 right-0 w-full"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          style={{ bottom: "26%", height: 76 }}
        >
          <path
            d="M0 40 Q80 6 180 26 T380 30 L400 60 L0 60 Z"
            fill="#97ca8c"
            opacity="0.85"
          />
        </svg>

        {/* Tree — left */}
        <svg
          className="absolute"
          style={{ left: 10, bottom: "22%", width: 82, height: 120 }}
          viewBox="0 0 82 120"
        >
          <rect x="36" y="70" width="10" height="36" fill="#8b5a2b" rx="3" />
          <circle cx="41" cy="46" r="28" fill="#6cb365" />
          <circle cx="28" cy="40" r="18" fill="#7dc074" />
          <circle cx="56" cy="40" r="18" fill="#7dc074" />
          <circle cx="30" cy="56" r="9" fill="#8ccc83" opacity="0.5" />
          <circle cx="52" cy="54" r="9" fill="#8ccc83" opacity="0.5" />
        </svg>
        {/* Tree — right */}
        <svg
          className="absolute"
          style={{ right: 14, bottom: "24%", width: 72, height: 108 }}
          viewBox="0 0 72 108"
        >
          <rect x="32" y="64" width="8" height="32" fill="#8b5a2b" rx="3" />
          <circle cx="36" cy="42" r="24" fill="#6cb365" />
          <circle cx="22" cy="38" r="14" fill="#7dc074" />
          <circle cx="50" cy="38" r="14" fill="#7dc074" />
        </svg>

        {/* Bushes along the horizon */}
        {[
          { left: "22%", bottom: "28%", w: 48, h: 22 },
          { left: "44%", bottom: "28%", w: 62, h: 24 },
          { left: "66%", bottom: "28%", w: 50, h: 22 },
        ].map((b, i) => (
          <div
            key={`bush-${i}`}
            className="absolute rounded-full bg-emerald-400/90"
            style={{ left: b.left, bottom: b.bottom, width: b.w, height: b.h }}
          />
        ))}

        {/* Grass blades on the foreground */}
        {[6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94].map((left, i) => (
          <svg
            key={`blade-${i}`}
            className="absolute"
            style={{
              left: `${left}%`,
              bottom: 6 + (i % 3) * 4,
              width: 10,
              height: 18 + (i % 4) * 3,
            }}
            viewBox="0 0 10 24"
          >
            <path
              d="M5 24 Q7 12 5 0 Q3 12 5 24 Z"
              fill={i % 2 === 0 ? "#4f9d4a" : "#5cab55"}
            />
          </svg>
        ))}

        {/* Flowers scattered in the grass */}
        {[
          { left: "10%", bottom: 26, color: "#ff95b0", size: 16 },
          { left: "24%", bottom: 12, color: "#ffd06b", size: 14 },
          { left: "36%", bottom: 20, color: "#b490ff", size: 16 },
          { left: "50%", bottom: 10, color: "#ff95b0", size: 15 },
          { left: "62%", bottom: 24, color: "#fff2a3", size: 14 },
          { left: "74%", bottom: 14, color: "#ff9ad3", size: 16 },
          { left: "88%", bottom: 22, color: "#b4e0ff", size: 14 },
        ].map((f, i) => (
          <Flower
            key={`fl-${i}`}
            left={f.left}
            bottom={f.bottom}
            color={f.color}
            size={f.size}
            delay={i * 0.15}
          />
        ))}

        {/* Butterfly — drifts across the scene */}
        <motion.div
          className="absolute text-xl select-none"
          initial={{ x: "-5%", y: 110 }}
          animate={{
            x: ["-5%", "25%", "55%", "80%", "105%"],
            y: [110, 80, 130, 90, 120],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.span
            animate={{ rotate: [-8, 8, -8] }}
            transition={{
              duration: 0.35,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block"
          >
            🦋
          </motion.span>
        </motion.div>
      </div>

      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur text-xs font-semibold text-gray-700 hover:bg-white transition"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur text-xs font-semibold text-orange-700">
            Tap for a meow · move for a walk
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFull();
            }}
            title={isFull ? "Exit fullscreen" : "Fullscreen"}
            className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-white/80 backdrop-blur text-gray-700 hover:bg-white transition"
          >
            {isFull ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {!started && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-white/80 text-xs font-semibold text-gray-600">
            Move your mouse — Miso will follow 🐾
          </div>
        </div>
      )}

      {/* Cat — jumps in arcs toward the yarn */}
      <motion.div
        animate={catControls}
        initial={{ x: 0, y: 0, scaleY: 1 }}
        className="absolute top-0 left-0 z-10 pointer-events-none origin-bottom"
      >
        <div
          className="relative"
          style={{
            transform: `translate(-54px, -78px) scaleX(${catFacing})`,
          }}
        >
          <Cat />
        </div>
      </motion.div>

      {/* Yarn ball (the cursor) */}
      {started && (
        <motion.div
          animate={{ x: yarn.x - 18, y: yarn.y - 18 }}
          transition={{ type: "spring", stiffness: 600, damping: 40 }}
          className="absolute top-0 left-0 z-20 pointer-events-none"
        >
          <YarnBall />
        </motion.div>
      )}

      {/* floating hearts on click */}
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ x: h.x - 10, y: h.y - 10, opacity: 0, scale: 0.6 }}
            animate={{ y: h.y - 80, opacity: [0, 1, 0], scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute top-0 left-0 z-30 text-2xl pointer-events-none select-none"
          >
            💛
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Flower({
  left,
  bottom,
  color,
  size,
  delay = 0,
}: {
  left: string;
  bottom: number;
  color: string;
  size: number;
  delay?: number;
}) {
  return (
    <motion.div
      className="absolute"
      style={{ left, bottom, width: size, height: size + 14 }}
      animate={{ rotate: [-3, 3, -3] }}
      transition={{
        duration: 2.6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* stem */}
      <div
        className="absolute bg-emerald-600/80 rounded-full"
        style={{
          left: "50%",
          bottom: 0,
          width: 2,
          height: 14,
          transform: "translateX(-50%)",
        }}
      />
      {/* leaf */}
      <div
        className="absolute bg-emerald-500/90 rounded-full"
        style={{
          left: "58%",
          bottom: 4,
          width: 6,
          height: 4,
          transform: "rotate(35deg)",
        }}
      />
      {/* petals */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        className="absolute top-0 left-0"
      >
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="10"
            cy="5"
            rx="3"
            ry="4"
            fill={color}
            transform={`rotate(${deg} 10 10)`}
          />
        ))}
        <circle cx="10" cy="10" r="2.2" fill="#fffa92" />
      </svg>
    </motion.div>
  );
}

function Cat() {
  return (
    <motion.svg
      width="108"
      height="104"
      viewBox="0 0 108 104"
      animate={{ y: [0, -2, 0] }}
      transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
    >
      {/* tail */}
      <motion.path
        d="M88 70 Q104 55 96 40"
        stroke="#c47b4a"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        animate={{ d: ["M88 70 Q104 55 96 40", "M88 70 Q102 62 92 44", "M88 70 Q104 55 96 40"] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      />
      {/* body */}
      <ellipse cx="54" cy="70" rx="34" ry="22" fill="#e39b6e" />
      <ellipse cx="54" cy="72" rx="24" ry="14" fill="#f6c89f" />
      {/* head */}
      <ellipse cx="50" cy="44" rx="24" ry="22" fill="#e39b6e" />
      {/* ears */}
      <path d="M30 30 L34 14 L44 26 Z" fill="#c47b4a" />
      <path d="M70 30 L66 14 L56 26 Z" fill="#c47b4a" />
      <path d="M33 26 L36 17 L41 24 Z" fill="#f6b088" />
      <path d="M67 26 L64 17 L59 24 Z" fill="#f6b088" />
      {/* eyes — blinking */}
      <motion.g
        animate={{ scaleY: [1, 1, 1, 0.1, 1, 1] }}
        transition={{ repeat: Infinity, duration: 4, times: [0, 0.45, 0.48, 0.5, 0.52, 1] }}
        style={{ transformOrigin: "50px 44px" }}
      >
        <circle cx="42" cy="44" r="3" fill="#1f1f1f" />
        <circle cx="58" cy="44" r="3" fill="#1f1f1f" />
        <circle cx="41" cy="43" r="1" fill="#fff" />
        <circle cx="57" cy="43" r="1" fill="#fff" />
      </motion.g>
      {/* nose + mouth */}
      <path d="M48 50 L52 50 L50 52 Z" fill="#c46a6a" />
      <path d="M50 52 Q46 56 43 54" stroke="#8a4a4a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M50 52 Q54 56 57 54" stroke="#8a4a4a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* stripes */}
      <path d="M32 38 Q38 34 44 38" stroke="#c47b4a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56 38 Q62 34 68 38" stroke="#c47b4a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M40 60 Q54 56 68 60" stroke="#c47b4a" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    </motion.svg>
  );
}

function YarnBall() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15" fill="#f2a5b6" stroke="#d97a90" strokeWidth="1.5" />
      <path d="M6 14 Q18 10 30 18" stroke="#d97a90" strokeWidth="1.2" fill="none" />
      <path d="M4 20 Q16 22 32 16" stroke="#d97a90" strokeWidth="1.2" fill="none" />
      <path d="M8 10 Q14 24 28 28" stroke="#d97a90" strokeWidth="1.2" fill="none" />
      <path d="M30 22 Q34 26 30 32" stroke="#d97a90" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
type GameId = null | "bubble" | "cozy";

// ─────────────────────────────────────────────
// Compact dashboard panels
// ─────────────────────────────────────────────
function StatStrip({ s }: { s: Summary }) {
  const tiles: {
    icon: React.ReactNode;
    label: string;
    value: string;
    hint: string;
    pct?: number;
    color: string;
    bar: string;
  }[] = [
      {
        icon: <Zap size={14} />,
        label: "Energy",
        value: `${s.energy}%`,
        hint:
          s.energy >= 70
            ? "Holding up well"
            : s.energy >= 50
              ? "Moderate"
              : "Low · rest soon",
        pct: s.energy,
        color: "text-amber-600",
        bar: "bg-amber-400",
      },
      {
        icon: <Scale size={14} />,
        label: "Balance",
        value: `${s.balance}%`,
        hint:
          s.balance >= 70
            ? "In rhythm"
            : s.balance >= 50
              ? "Slipping"
              : "Needs rest",
        pct: s.balance,
        color: "text-sky-600",
        bar: "bg-sky-400",
      },
      {
        icon: <TrendingUp size={14} />,
        label: "Focus",
        value: `${s.focusScore}%`,
        hint: `${s.minutes}m / ${s.preferred}m optimal`,
        pct: s.focusScore,
        color: "text-violet-600",
        bar: "bg-violet-400",
      },
    ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="bg-white rounded-2xl border border-gray-100 p-4"
        >
          <div className={`flex items-center gap-1.5 ${t.color}`}>
            {t.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {t.label}
            </span>
          </div>
          <p className="text-xl font-black text-gray-900 mt-1 tabular-nums">
            {t.value}
          </p>
          {t.pct !== undefined && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${t.bar} rounded-full transition-all duration-700`}
                style={{ width: `${t.pct}%` }}
              />
            </div>
          )}
          <p className="text-[11px] text-gray-500 mt-1.5">{t.hint}</p>
        </div>
      ))}
    </div>
  );
}

function LearningStressChip({ s }: { s: Summary }) {
  const color =
    s.stress === "High"
      ? "bg-rose-50 text-rose-700 border-rose-100"
      : s.stress === "Moderate"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : "bg-emerald-50 text-emerald-700 border-emerald-100";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          Learning stress
        </p>
        <p className="text-sm text-gray-800 mt-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color} mr-2`}>
            {s.stress}
          </span>
          {s.moduleName} · attempt {s.attemptCount}
        </p>
      </div>
      {s.minutes > s.preferred && (
        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2 py-1 shrink-0">
          ⚡ {s.minutes - s.preferred}m past optimal
        </span>
      )}
    </div>
  );
}

function MiniTrendChart({ s }: { s: Summary }) {
  const W = 560;
  const H = 120;
  const PL = 24;
  const PR = 10;
  const PT = 10;
  const PB = 18;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const N = s.monthlyStress.length;

  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = PL + (i / (N - 1)) * plotW;
        const y = PT + plotH - (v / 100) * plotH;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const TrendIcon =
    s.stressTrend === "lower"
      ? TrendingDown
      : s.stressTrend === "stable"
        ? Minus
        : TrendingUp;
  const trendColor =
    s.stressTrend === "lower"
      ? "text-emerald-600"
      : s.stressTrend === "stable"
        ? "text-gray-500"
        : "text-rose-600";
  const trendLabel =
    s.stressTrend === "highest_week"
      ? "Highest this week"
      : s.stressTrend === "much_higher"
        ? "Spiking"
        : s.stressTrend === "higher"
          ? "Rising"
          : s.stressTrend === "lower"
            ? "Improving"
            : "Stable";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Stress & focus · last 30 days
          </p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon size={12} />
          <span>{trendLabel}</span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {[0, 50, 100].map((v) => {
          const y = PT + plotH - (v / 100) * plotH;
          return (
            <line
              key={v}
              x1={PL}
              x2={W - PR}
              y1={y}
              y2={y}
              stroke="#f0f0f0"
              strokeDasharray="3 3"
            />
          );
        })}
        <path
          d={toPath(s.monthlyStress)}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={toPath(s.monthlyFocus)}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Stress
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
          <span className="w-2 h-2 rounded-full bg-violet-500" /> Focus
        </span>
      </div>
    </div>
  );
}

function InsightCard({ s }: { s: Summary }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-lg shrink-0">
        🤖
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1">
          Care insight
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{s.insight}</p>
        <p className="text-sm text-violet-700 font-semibold leading-relaxed mt-1.5">
          → {s.action}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Carely — floating chat companion
// ─────────────────────────────────────────────
type ChatMsg = { role: "user" | "assistant"; text: string };

function CareChat({
  s,
  firstName,
  open,
  setOpen,
}: {
  s: Summary;
  firstName: string;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      const greet =
        s.stress === "High"
          ? `Hi${firstName ? ` ${firstName}` : ""} 💜 ${s.minutes} min on ${s.moduleName}, last break ${s.lastBreak} min ago — how are you holding up?`
          : s.stress === "Moderate"
            ? `Hey${firstName ? ` ${firstName}` : ""} 🌿 ${s.minutes} min in, focus dipping a little. Want to talk?`
            : `Hi${firstName ? ` ${firstName}` : ""} 🌟 Your session looks balanced. Anything on your mind?`;
      setMessages([{ role: "assistant", text: greet }]);
    }
  }, [open, messages.length, s, firstName]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const text = input;
    const history = messages.filter((m, i) => !(i === 0 && m.role === "assistant"));
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat/carely", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: [...history, { role: "user", text }],
        }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        data.text ||
        data.response ||
        data.message ||
        data.content?.[0]?.text ||
        "I'm here for you 🌿";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry — having trouble connecting." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="panel"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed top-0 bottom-0 right-0 w-80 lg:w-96 bg-white border-l border-gray-200 shadow-2xl z-[100] flex flex-col"
        >
          <div className="bg-[#8B5CF6] p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <img
                src="/images/avatars/hadri.png"
                alt="Carely"
                className="w-11 h-11 rounded-full border-2 border-white object-cover"
              />
              <div>
                <p className="text-white font-black text-base leading-tight flex items-center gap-1.5">
                  Dr. Care
                  <span className="text-[9px] bg-white text-violet-700 font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md">
                    AI
                  </span>
                </p>
                <p className="text-white/80 text-[11px]">Wellbeing companion</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:bg-white/20 p-1.5 rounded-full transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                    ? "bg-[#8B5CF6] text-white rounded-br-sm"
                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                >
                  <div className="prose prose-sm max-w-none prose-p:my-0">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:100ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:200ms]" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="p-3 border-t border-gray-100 bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Talk to Carely…"
                className="w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              <button
                type="submit"
                disabled={busy}
                className="absolute right-1 top-1 bottom-1 w-9 bg-[#8B5CF6] text-white rounded-full flex items-center justify-center hover:bg-violet-700 transition disabled:opacity-50"
              >
                <Send size={14} className={busy ? "animate-pulse" : ""} />
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.button
          key="fab"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-[#8B5CF6] rounded-full shadow-[0_10px_25px_rgba(147,51,234,0.4)] flex items-center justify-center z-[100] border-4 border-white group"
        >
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          <img
            src="/images/avatars/hadri.png"
            alt="Carely"
            className="w-full h-full rounded-full object-cover group-hover:opacity-0 transition-opacity"
          />
          <MessageCircle
            size={24}
            className="text-white absolute opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function CareSpacePage() {
  const [firstName, setFirstName] = useState<string>("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [game, setGame] = useState<GameId>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    (async () => {
      setSummary(buildSummary());
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const full = data.user?.user_metadata?.full_name as string | undefined;
        if (full) setFirstName(full.split(" ")[0]);
      } catch {
        // ignore
      }
    })();
  }, []);

  if (!summary) {
    return (
      <main className="min-h-screen bg-[#FBF8F3] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const moodMsg: Record<Mood, string> = {
    good: "Lovely — let's keep that glow.",
    okay: "Middle ground is a fine place to rest.",
    low: "It's okay to feel this way. Breathe with me.",
  };

  return (
    <main
      className={`min-h-screen bg-[#FBF8F3] transition-[padding] duration-300 ease-out ${
        chatOpen ? "lg:pr-96 md:pr-80" : ""
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Greeting */}
        <section>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[28px] md:text-[34px] font-bold text-gray-900 tracking-tight"
          >
            How are you feeling today
            {firstName ? `, ${firstName}` : ""}?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-gray-500 mt-1"
          >
            {summary.sentence}
          </motion.p>

          {/* Mood pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            {MOODS.map((m) => {
              const active = mood === m.id;
              return (
                <motion.button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`group relative px-5 py-3 rounded-2xl border transition-all flex items-center gap-2.5 ${active
                    ? "border-transparent shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                >
                  {active && (
                    <span
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${m.color} opacity-90`}
                    />
                  )}
                  <span className="relative text-xl">{m.emoji}</span>
                  <span
                    className={`relative text-sm font-semibold ${active ? "text-gray-800" : "text-gray-700"
                      }`}
                  >
                    {m.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {mood && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-sm text-gray-600"
              >
                {moodMsg[mood]}
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* Wellbeing panels — compact */}
        <section className="space-y-4">
          <StatStrip s={summary} />
          <LearningStressChip s={summary} />
          <MiniTrendChart s={summary} />
          <InsightCard s={summary} />
        </section>

        {/* Games */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              A gentle break
            </h2>
            <span className="text-xs text-gray-400">pick one</span>
          </div>

          <AnimatePresence mode="wait">
            {game === null && (
              <motion.div
                key="cards"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <GameCard
                  onClick={() => setGame("bubble")}
                  title="Bubble Pop"
                  subtitle="Each bubble sings a soft note."
                  gradient="from-sky-200 via-indigo-200 to-violet-200"
                  emoji="🫧"
                />
                <GameCard
                  onClick={() => setGame("cozy")}
                  title="Cozy Meow"
                  subtitle="A cat follows your yarn. Breathe."
                  gradient="from-amber-200 via-rose-200 to-orange-200"
                  emoji="🐱"
                />
              </motion.div>
            )}

            {game === "bubble" && (
              <motion.div
                key="bubble"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <BubblePopGame onBack={() => setGame(null)} />
              </motion.div>
            )}

            {game === "cozy" && (
              <motion.div
                key="cozy"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <CozyMeowGame onBack={() => setGame(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <CareChat
        s={summary}
        firstName={firstName}
        open={chatOpen}
        setOpen={setChatOpen}
      />
    </main>
  );
}

function GameCard({
  onClick,
  title,
  subtitle,
  gradient,
  emoji,
}: {
  onClick: () => void;
  title: string;
  subtitle: string;
  gradient: string;
  emoji: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-3xl p-6 text-left bg-gradient-to-br ${gradient} shadow-sm hover:shadow-lg transition-shadow border border-white/50`}
    >
      {/* glow */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/40 blur-2xl" />
      <div className="absolute -bottom-16 -left-4 w-40 h-40 rounded-full bg-white/30 blur-2xl" />

      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center text-3xl shadow-sm">
          {emoji}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-700/80">{subtitle}</p>
        </div>
      </div>

      <div className="relative mt-8 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700/80 uppercase tracking-widest">
          Play
        </span>
        <motion.span
          className="text-xl"
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        >
          →
        </motion.span>
      </div>
    </motion.button>
  );
}
