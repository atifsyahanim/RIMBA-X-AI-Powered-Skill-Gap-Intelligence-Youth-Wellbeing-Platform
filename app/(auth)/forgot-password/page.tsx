"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Logo / Brand */}
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg shadow-primary/20">
          R
        </div>
        <h1 className="text-2xl font-bold text-secondary tracking-tight">
          Rimba<span className="text-primary">X</span>
        </h1>
        <p className="mt-1 text-sm text-text-muted">Reset your password</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {sent ? (
          <div className="text-center flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              If an account exists for <strong>{email}</strong>, you will
              receive a password reset link shortly. Check your inbox (and spam
              folder).
            </p>
            <Link
              href="/login"
              className="text-primary font-bold hover:underline text-sm"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <p className="text-sm text-text-muted -mt-1">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
          </form>
        )}
      </div>

      {/* Footer link */}
      <p className="mt-5 text-center text-sm text-text-muted">
        <Link href="/login" className="text-primary font-bold hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
