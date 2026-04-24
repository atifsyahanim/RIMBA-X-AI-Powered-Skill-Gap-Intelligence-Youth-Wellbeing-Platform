"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import {
  Target,
  Zap,
  ArrowRight,
  Award,
  Sparkles,
  Play,
  Clock,
  Flame,
  BarChart3,
  BookOpen,
  Brain,
  AlertCircle,
  ChevronRight,
  Compass,
} from "lucide-react";
import { useRouter } from "next/navigation";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

// Helper to get auth token
async function getAuthToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

// -------------------------------------------------------------
// SUBCOMPONENTS
// -------------------------------------------------------------

function HeroSection({
  score = 40,
  targetRole = "AI Engineer",
  name = "farah",
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden gradient-hero rounded-2xl p-6 md:p-8 shadow-lg text-white"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            Good morning, <span className="text-amber-300">{name}</span> 👋
          </h2>
          <p className="text-white/80 text-sm max-w-lg leading-relaxed flex items-center gap-1.5 font-medium">
            You are <strong className="text-white font-black">{score}%</strong>{" "}
            ready for your target role:{" "}
            <strong className="text-amber-200 font-bold">{targetRole}</strong>.
          </p>
          <p className="text-white/80 text-xs mt-1 border-l-2 border-white/30 pl-3 italic">
            “You’re progressing well. Focus on Python & Deep Learning next.”
          </p>
        </div>

        <Link href="/career/analyse">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-white text-[#8B5CF6] text-sm font-bold px-5 py-3 rounded-xl shadow-md hover:bg-gray-50 transition-all"
          >
            <Play className="w-4 h-4 fill-[#8B5CF6]" />
            Continue Learning
          </motion.button>
        </Link>
      </div>
    </motion.section>
  );
}

function NextActionCard() {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
    >
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
        <Target size={140} />
      </div>
      <div>
        <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-full mb-3 inline-block">
          2. Next Action
        </span>
        <h3 className="text-lg font-black text-gray-900 tracking-tight">
          {" "}
          What Should You Do Next?{" "}
        </h3>
        <div className="mt-4 bg-gray-50/80 rounded-xl p-4 border border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">
              Start Python Programming
            </h4>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 font-medium">
              <span className="flex items-center gap-1 text-red-500 font-bold">
                <AlertCircle size={12} /> Critical gap
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> ~40h to learn
              </span>
            </div>
          </div>
        </div>
      </div>
      <Link href="/career/modules" className="mt-4">
        <button className="w-full flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-violet-600 shadow-lg shadow-violet-500/20 text-white font-bold text-sm rounded-xl py-3 transition-colors">
          Resume Module <ArrowRight size={14} />
        </button>
      </Link>
    </motion.div>
  );
}

function InProgressModules() {
  const modules = [
    {
      title: "Detection System Module",
      level: "Level 2",
      progress: 72,
      color: "bg-[#8B5CF6]",
    },
    {
      title: "Data Structures",
      level: "Level 1",
      progress: 30,
      color: "bg-blue-500",
    },
  ];

  return (
    <motion.div
      variants={fadeUp}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
    >
      <h3 className="text-md font-black text-gray-950 flex items-center gap-2 mb-4">
        🧠 3. Continue Where You Left Off
      </h3>
      <div className="space-y-4">
        {modules.map((mod, i) => (
          <div
            key={i}
            className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2 hover:border-violet-200 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-900 text-sm leading-tight">
                  {mod.title}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  {mod.level}
                </p>
              </div>
              <span className="text-xs font-black text-[#8B5CF6]">
                {mod.progress}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${mod.color} rounded-full`}
                style={{ width: `${mod.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function QuickSkillSnapshot() {
  const skills = [
    { label: "Technical", score: 55, color: "bg-[#8B5CF6]" },
    { label: "Analytical", score: 45, color: "bg-blue-500" },
    { label: "Practical", score: 30, color: "bg-amber-500" },
  ];

  return (
    <motion.div
      variants={fadeUp}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center"
    >
      <h3 className="text-md font-black text-gray-950 flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-[#8B5CF6]" /> 5. Skill Snapshot
      </h3>
      <div className="space-y-3.5 flex-1 flex flex-col justify-center">
        {skills.map((skill, i) => (
          <div key={i}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-bold text-gray-600 uppercase tracking-wider">
                {skill.label}
              </span>
              <span className="font-black text-gray-900">{skill.score}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${skill.color} rounded-full`}
                style={{ width: `${skill.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AchievementsPreview() {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-black text-gray-950 flex items-center gap-2">
          <Award size={18} className="text-[#8B5CF6]" /> 4. Your Achievements
        </h3>
        <Link
          href="/dashboard/achievements"
          className="text-xs font-bold text-[#8B5CF6] hover:underline flex items-center gap-0.5"
        >
          View All <ChevronRight size={12} />
        </Link>
      </div>
      <div className="space-y-2 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3 bg-violet-50/50 p-3 rounded-xl border border-violet-100">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
            🏆
          </div>
          <div>
            <h4 className="font-black text-gray-900 text-sm">
              8 Badges Unlocked
            </h4>
            <p className="text-[10px] text-gray-500 font-medium">
              Latest: Detection Workflow
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendedPath() {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full"
    >
      <h3 className="text-md font-black text-gray-950 flex items-center gap-2 mb-4">
        <Compass size={18} className="text-blue-500" /> 6. Fastest Way to
        Improve
      </h3>
      <div className="space-y-2 flex-1 flex flex-col justify-center">
        {["Python Programming", "Deep Learning", "Data Structures"].map(
          (path, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-100 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-gray-800">{path}</span>
            </div>
          ),
        )}
      </div>
      <Link href="/career/analyse" className="mt-4">
        <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 shadow-md text-white font-bold text-xs rounded-xl py-2.5 transition-opacity">
          Follow Path <ArrowRight size={14} />
        </button>
      </Link>
    </motion.div>
  );
}

function AICoachTip() {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden flex flex-col justify-center h-full"
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
        <Brain size={90} className="text-[#8B5CF6]" />
      </div>
      <h4 className="flex items-center gap-2 text-xs font-black text-[#8B5CF6] mb-2">
        🤖 7. AI Coach Tip
      </h4>
      <div className="flex items-start gap-3">
        <p className="text-xs text-violet-950 leading-relaxed font-medium">
          “You’re struggling with preprocessing. Try reviewing{" "}
          <strong className="text-violet-800 font-bold">normalization</strong>{" "}
          before moving forward.”
        </p>
      </div>
    </motion.div>
  );
}

// -------------------------------------------------------------
// MAIN PAGE
// -------------------------------------------------------------

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [score, setScore] = useState(40);
  const [targetCareer, setTargetCareer] = useState("AI Engineer");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Get auth token
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;

          // Fetch target career from profile API
          const profileRes = await fetch(
            `/api/career/profile?user_id=${user.id}`,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
          );
          const profileData = profileRes.ok ? await profileRes.json() : null;
          if (profileData?.profile?.target_career) {
            setTargetCareer(profileData.profile.target_career);
          }

          // Fetch match score from analysis API
          const analysisRes = await fetch(`/api/career/analyse?latest=1`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const analysisData = analysisRes.ok ? await analysisRes.json() : null;
          if (analysisData?.data?.match_score) {
            setScore(analysisData.data.match_score);
          }

          // Fetch stats from stats API
          const statsRes = await fetch(`/api/user/stats?user_id=${user.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] w-full pt-2 pb-6 px-4 md:pt-4 md:pb-10 md:px-8 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 1. HERO SECTION */}
        <HeroSection score={score} targetRole={targetCareer} name={userName} />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* LEFT COLUMN: Core learning actions (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NextActionCard />
              <InProgressModules />
            </div>
            <QuickSkillSnapshot />
          </div>

          {/* RIGHT COLUMN: Supporting widgets (1/3 width) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
              <AchievementsPreview />
              <RecommendedPath />
              <AICoachTip />
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
