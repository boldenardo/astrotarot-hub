"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Hash } from "lucide-react";
import Navbar from "@/components/Navbar";
import PremiumGate from "@/components/PremiumGate";
import {
  computeNumerology,
  parseBirthDate,
  type NumerologyResult,
  type NumerologyNumber,
} from "@/lib/numerology";

export default function NumerologyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [result, setResult] = useState<NumerologyResult | null>(null);
  const [error, setError] = useState("");
  const [aiInterpretation, setAiInterpretation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function fetchAiInterpretation(fullName: string, birthDate: string) {
    setAiLoading(true);
    setAiInterpretation("");
    try {
      const res = await fetch("/api/numerology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, birthDate }),
      });

      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (!res.ok) {
        // Silent failure: keep only the locally computed numbers
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.interpretation) {
        setAiInterpretation(data.interpretation);
      }
    } catch {
      // Silent failure: keep only the locally computed numbers
    } finally {
      setAiLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parts = parseBirthDate(birth);
    if (!name.trim() || !parts) {
      setError("Please enter your full name and a valid birth date.");
      setResult(null);
      return;
    }
    setResult(computeNumerology(name, parts));
    void fetchAiInterpretation(name, birth);
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />

      <PremiumGate feature="numerology">
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold">
            <Hash className="h-7 w-7 text-night-900" />
          </span>
          <h1 className="font-display text-3xl font-semibold text-ink-50 sm:text-5xl md:text-6xl">
            Your <span className="text-gold">Numerology</span> Profile
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-400 sm:text-lg">
            Your name and birth date carry a numeric blueprint. Discover the
            core numbers that shape your path.
          </p>
        </motion.div>

        <form
          onSubmit={handleSubmit}
          className="glass glass-gold mx-auto mb-12 max-w-xl rounded-4xl p-5 sm:p-8"
        >
          <label className="mb-2 block text-sm font-medium text-ink-200">
            Full name (as given at birth)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Jane Miller"
            className="mb-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-ink-100 placeholder:text-ink-600 focus:border-gold-400/50 focus:outline-none"
          />

          <label className="mb-2 block text-sm font-medium text-ink-200">
            Birth date
          </label>
          <input
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            className="mb-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-ink-100 focus:border-gold-400/50 focus:outline-none [color-scheme:dark]"
          />

          {error && (
            <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-gold flex w-full items-center justify-center gap-2 rounded-full py-4"
          >
            <Sparkles className="h-5 w-5" />
            Reveal My Numbers
          </button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <FeaturedNumber
              label="Life Path"
              hint="Your core life theme"
              value={result.lifePath}
            />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <NumberCard
                label="Expression"
                hint="Your natural talents"
                value={result.expression}
              />
              <NumberCard
                label="Soul Urge"
                hint="Your inner cravings"
                value={result.soulUrge}
              />
              <NumberCard
                label="Personality"
                hint="How others see you"
                value={result.personality}
              />
              <NumberCard
                label="Birthday"
                hint="A special gift"
                value={result.birthday}
              />
            </div>

            {/* Personalized AI interpretation */}
            {(aiLoading || aiInterpretation) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass glass-gold rounded-4xl p-5 sm:p-8"
              >
                <div className="mb-4 flex items-center gap-3">
                  <Sparkles className="h-6 w-6 flex-shrink-0 text-gold-300" />
                  <h3 className="font-display text-xl font-semibold text-ink-50 sm:text-2xl">
                    Personalized AI Interpretation
                  </h3>
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-3 py-4 text-ink-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-gold-400/40 border-t-gold-400"
                    />
                    Generating your personalized interpretation...
                  </div>
                ) : (
                  <p className="whitespace-pre-line break-words leading-relaxed text-ink-200">
                    {aiInterpretation}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </section>
      </PremiumGate>
    </main>
  );
}

function FeaturedNumber({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: NumerologyNumber;
}) {
  return (
    <div className="glass glass-gold flex flex-col items-center gap-6 rounded-4xl p-6 text-center sm:p-8 md:flex-row md:text-left">
      <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold sm:h-28 sm:w-28">
        <span className="font-display text-4xl font-semibold leading-none text-night-900 sm:text-5xl">
          {value.number}
        </span>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-center gap-2 md:justify-start">
          <span className="text-sm font-semibold uppercase tracking-wider text-gold-300">
            {label}
          </span>
          {value.isMaster && (
            <span className="rounded-full border border-gold-400/30 bg-gold-400/10 px-2 py-0.5 text-xs font-semibold text-gold-300">
              Master Number
            </span>
          )}
        </div>
        <h3 className="break-words font-display text-2xl font-semibold text-ink-50 sm:text-3xl">
          {value.title}
        </h3>
        <p className="mt-2 text-ink-400">{value.meaning}</p>
        <p className="mt-1 text-sm text-ink-600">{hint}</p>
      </div>
    </div>
  );
}

function NumberCard({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: NumerologyNumber;
}) {
  return (
    <div className="glass rounded-3xl border-white/5 p-5 transition-colors hover:border-gold-400/30 sm:p-6">
      <div className="mb-4 flex items-center gap-4">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/10">
          <span className="font-display text-2xl font-semibold leading-none text-gold">
            {value.number}
          </span>
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gold-300">
            {label}
          </span>
          <h4 className="font-display text-xl font-semibold text-ink-50">
            {value.title}
          </h4>
        </div>
      </div>
      <p className="text-sm text-ink-400">{value.meaning}</p>
      <p className="mt-2 text-xs text-ink-600">{hint}</p>
    </div>
  );
}
