"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Check uw e-mail voor de inloglink.",
      });
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "#0f1a2e" }}
    >
      {/* Achtergrond */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,26,46,0.85) 0%, rgba(26,45,74,0.7) 40%, rgba(21,34,56,0.8) 100%)",
        }}
      />

      {/* Login card */}
      <div className="w-full max-w-md mx-auto px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/[0.07] backdrop-blur-sm mb-6 ring-1 ring-white/10">
            <Image
              src="/yielder-monogram.png"
              alt="Yielder"
              width={32}
              height={32}
              className="object-contain brightness-0 invert"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welkom bij Mijn Yielder
          </h1>
          <p className="text-sm text-white/40 mt-2 font-light">
            Log in met uw e-mailadres
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleMagicLink} className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider"
            >
              E-mailadres
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 text-sm text-white bg-white/[0.06]
                border border-white/[0.12] rounded-2xl
                focus:outline-none focus:ring-2 focus:ring-white/20
                focus:border-white/25 focus:bg-white/[0.10]
                focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)]
                transition-all placeholder-white/20"
              placeholder="naam@bedrijf.nl"
            />
          </div>

          {/* Status bericht */}
          {message && (
            <div
              className={`text-sm px-4 py-3 rounded-xl ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-300 border border-red-500/20"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3.5 mt-3 text-sm font-semibold text-[#1a2d4a]
              bg-white rounded-full hover:bg-white/95 active:scale-[0.98]
              transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)]
              disabled:opacity-50 disabled:cursor-not-allowed
              relative overflow-hidden"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Versturen...
              </span>
            ) : (
              "Inloglink versturen"
            )}
          </button>
        </form>

        {/* SSO placeholder */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 text-white/30 bg-[#0f1a2e]">of</span>
            </div>
          </div>
          <button
            disabled
            className="w-full mt-4 py-3 text-sm font-medium text-white/40
              bg-white/[0.04] border border-white/[0.08] rounded-full
              cursor-not-allowed transition-all"
          >
            Inloggen via SSO (binnenkort)
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-10 opacity-40">
          <svg className="size-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1L2 4v4c0 2.2 1.6 3.6 4 4 2.4-.4 4-1.8 4-4V4L6 1z"
              stroke="white"
              strokeWidth="1"
              fill="none"
            />
          </svg>
          <span className="text-xs text-white/60 tracking-wide">
            Beveiligd door Yielder
          </span>
        </div>
      </div>
    </div>
  );
}
