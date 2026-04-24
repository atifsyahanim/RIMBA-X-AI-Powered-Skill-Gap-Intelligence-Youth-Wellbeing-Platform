"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  UserCircle2,
} from "lucide-react";
import Link from "next/link";
import { CareerRecommendCard } from "@/components/career/CareerRecommendCard";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client"; // ADD THIS IMPORT

interface Recommendation {
  title: string;
  fit_score: number;
  description: string;
  required_skills: string[];
  salary_range_myr: { min: number; max: number };
  growth_outlook: string;
  why_good_fit: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function CareerRecommendPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [savingTarget, setSavingTarget] = useState<string | null>(null);

  // Check if profile exists on mount
  useEffect(() => {
    async function checkProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const response = await fetch(
            `/api/career/profile?user_id=${user.id}`,
          );
          const json = await response.json();
          setHasProfile(!!json.profile);
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setHasProfile(false);
      }
    }

    checkProfile();
  }, []);

  const generateRecs = async () => {
    setLoading(true);
    setRecommendations([]);
    try {
      const res = await fetch("/api/career/recommend", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to generate recommendations");
        return;
      }
      setRecommendations(json.recommendations ?? []);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetTarget = async (title: string) => {
    setSavingTarget(title);
    try {
      const res = await fetch("/api/career/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_career: title }),
      });
      if (res.ok) {
        toast.success(`Target career set to "${title}"`);
      } else {
        const j = await res.json();
        toast.error(j.error || "Failed to save target");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingTarget(null);
    }
  };

  const profileLoading = hasProfile === null;

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-amber-500 mx-6 mt-6 rounded-2xl">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, white 0, white 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, white 0, white 1px, transparent 1px, transparent 28px)",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            suppressHydrationWarning
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/20 rounded-full p-2">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
                AI-Powered
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Career Recommendations
            </h1>
            <p className="text-white/80 text-base max-w-xl">
              Discover careers that match your skills, experience, and goals —
              powered by Gemini AI.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Profile check loading */}
        {profileLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasProfile ? (
          /* No profile CTA */
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-3xl border border-amber-100 shadow-xl p-10 text-center max-w-lg mx-auto mt-8"
            suppressHydrationWarning
          >
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCircle2 size={32} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Build your profile first
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              We need to know your skills, experience, and goals to generate
              personalised career recommendations.
            </p>
            <Link href="/career/profile">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 gap-2 px-6">
                Set Up Career Profile <ArrowRight size={16} />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Generate button */}
            {recommendations.length === 0 && !loading && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-center py-12"
                suppressHydrationWarning
              >
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <Sparkles size={36} className="text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ready to discover your path?
                </h2>
                <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
                  Click below and Gemini AI will analyse your profile and
                  recommend the top 3 career paths best suited for you.
                </p>
                <motion.button
                  onClick={generateRecs}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-200"
                >
                  <Sparkles size={18} />
                  Generate My Recommendations
                </motion.button>
              </motion.div>
            )}

            {/* Loading state */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16"
                >
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="w-20 h-20 rounded-full border-4 border-amber-100 animate-pulse" />
                    <div className="absolute w-20 h-20 rounded-full border-4 border-t-amber-500 border-transparent animate-spin" />
                    <Sparkles size={24} className="absolute text-amber-500" />
                  </div>
                  <p className="text-gray-600 font-medium text-base">
                    Gemini is analysing your profile…
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    This usually takes 5–10 seconds
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {recommendations.length > 0 && !loading && (
                <motion.div
                  key="results"
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    variants={fadeUp}
                    className="flex items-center justify-between mb-6"
                    suppressHydrationWarning
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Your Top Career Matches
                      </h2>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Based on your skills, experience, and goals
                      </p>
                    </div>
                    <motion.button
                      onClick={generateRecs}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50"
                    >
                      <RefreshCw size={14} />
                      Regenerate
                    </motion.button>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {recommendations.map((rec, i) => (
                      <motion.div
                        key={rec.title}
                        variants={fadeUp}
                        suppressHydrationWarning
                      >
                        <CareerRecommendCard
                          rec={rec}
                          rank={i}
                          onSetTarget={
                            savingTarget ? undefined : handleSetTarget
                          }
                        />
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    variants={fadeUp}
                    className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3"
                    suppressHydrationWarning
                  >
                    <AlertCircle
                      size={18}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-amber-800">
                      These recommendations are AI-generated based on your
                      profile. Use them as a starting point — tap{" "}
                      <strong>Set as Target</strong> to lock in a career goal
                      and build a personalised learning plan.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
