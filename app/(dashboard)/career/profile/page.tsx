"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCircle2, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { CareerProfileForm } from "@/components/career/CareerProfileForm";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  full_name?: string;
  current_level?: string;
  field_of_study?: string;
  institution?: string;
  graduation_year?: number;
  current_skills?: string[];
  work_experience?: {
    company: string;
    role: string;
    duration_months: number;
  }[];
  certifications?: string[];
  target_career?: string;
  target_industry?: string;
  career_goals?: string;
  location?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function CareerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        // Get the current user first
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile with user_id
        const response = await fetch(`/api/career/profile?user_id=${user.id}`);
        const json = await response.json();

        setProfile(json.profile ?? null);
        if (json.profile) setSaved(true);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Hero */}
      <div className="relative overflow-hidden gradient-hero mx-6 mt-6 rounded-2xl">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, white 0, white 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, white 0, white 1px, transparent 1px, transparent 28px)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-8 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            suppressHydrationWarning
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/20 rounded-full p-2">
                <UserCircle2 size={20} className="!text-white" />
              </div>
              <span className="!text-white/70 text-sm font-medium uppercase tracking-wider">
                Step 1 of 5
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold !text-white mb-2">
              Build Your Profile
            </h1>
            <p className="!text-white/75 text-base max-w-lg">
              Provide your skills, education, and experience to help us analyze
              your readiness and identify gaps.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="animate-pulse flex flex-col gap-3">
              <div className="h-4 bg-gray-100 rounded w-48" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-32 mt-2" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-40 mt-2" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            suppressHydrationWarning
          >
            <CareerProfileForm
              initialData={
                profile
                  ? {
                      full_name: profile.full_name,
                      current_level: profile.current_level,
                      field_of_study: profile.field_of_study,
                      institution: profile.institution,
                      graduation_year: profile.graduation_year?.toString(),
                      current_skills: profile.current_skills ?? [],
                      work_experience: profile.work_experience ?? [],
                      certifications: profile.certifications ?? [],
                      target_career: profile.target_career,
                      target_industry: profile.target_industry,
                      career_goals: profile.career_goals,
                      location: profile.location,
                    }
                  : undefined
              }
              onSuccess={() => setSaved(true)}
            />

            {saved && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5"
                suppressHydrationWarning
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-green-100 rounded-full p-1.5 shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Profile saved successfully!
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Your career profile is ready. Here&apos;s what you can do
                      next:
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href="/career/analyse" className="flex-1">
                    <button className="w-full flex items-center justify-center gap-2 bg-white border border-green-200 hover:bg-green-50 text-green-700 font-medium text-sm rounded-xl px-4 py-2.5 transition-colors">
                      Run Skill Gap Intelligence <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
