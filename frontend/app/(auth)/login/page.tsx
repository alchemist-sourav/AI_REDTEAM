"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-black-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-1 mb-8">
          <span className="text-red-500 text-3xl font-black tracking-tight">
            AI
          </span>
          <span className="text-white text-3xl font-black tracking-tight">
            _REDTEAM
          </span>
        </div>

        {/* Card */}
        <div className="bg-black-200 border border-black-500 rounded-xl p-8 shadow-2xl">
          <h1 className="text-lg font-semibold text-white mb-1 text-center">
            Security Platform
          </h1>
          <p className="text-sm text-neutral-400 text-center mb-6">
            Sign in to continue
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-600/40 bg-red-600/10 px-4 py-3">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-neutral-400 mb-1.5"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-neutral-400 mb-1.5"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-600">
          AI_REDTEAM — LLM Security Assessment Platform
        </p>
      </div>
    </div>
  );
}