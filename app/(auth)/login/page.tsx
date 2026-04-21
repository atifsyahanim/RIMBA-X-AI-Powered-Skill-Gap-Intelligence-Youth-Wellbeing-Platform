"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        // Ensure user progress/stats rows exist (idempotent)
        await fetch("/api/init-user", {
          method: "POST",
          credentials: "include",
        }).catch(() => null);
        toast.success("Logged in successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }

    /*
    try {
      // FAKE LOGIN FOR DEMO PURPOSE
      await new Promise((res) => setTimeout(res, 500));

      localStorage.setItem(
        "mock_user",
        JSON.stringify({
          email,
          name: "Demo User",
        }),
      );

      toast.success("Logged in successfully!");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    } */
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
        <p className="mt-1 text-sm text-text-muted">Sign in to your account</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="text-right -mt-2">
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-5 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-bold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
