"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Sparkles, Clock, Moon } from "lucide-react";
import { ZODIAC_SIGNS } from "@/lib/quiz-data";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.5, ease: "easeOut" },
  }),
};

export default function QuizLandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-xs font-medium text-[#e8d9a8]"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Your 2026 Cosmic Reading
      </motion.div>

      <motion.h1
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-balance text-4xl leading-tight sm:text-5xl"
      >
        Ready to finally unlock what{" "}
        <span className="text-gold">2026 has planned</span> for you?
      </motion.h1>

      <motion.p
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-4 max-w-md text-balance text-base text-[#b9b2d0]"
      >
        Take the 2-minute cosmic reading and get your personalized plan for
        love, money and purpose.
      </motion.p>

      {/* Luna introduction */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-4 flex items-center gap-2.5 text-sm text-[#b9b2d0]"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #edd9a3, #d4af37 60%, #a9822f)",
          }}
        >
          <Moon className="h-3.5 w-3.5 text-[#1a1430]" />
        </span>
        <span>
          Guided by <span className="font-medium text-[#e8d9a8]">Luna</span>{" "}
          &mdash; she reads your answers as you go.
        </span>
      </motion.div>

      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-8 w-full max-w-sm"
      >
        <Link
          href="/quiz/flow"
          className="btn-gold flex min-h-[56px] w-full items-center justify-center rounded-xl px-8 text-base"
        >
          Start my free reading
        </Link>
      </motion.div>

      {/* Trust row */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-6 flex flex-col items-center gap-2 text-sm text-[#b9b2d0]"
      >
        <span className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className="h-4 w-4 fill-[#d4af37] text-[#d4af37]"
              />
            ))}
          </span>
          <span className="font-semibold text-[#e8e4f5]">4.9</span>
          <span aria-hidden="true">&middot;</span>
          <span>120,000+ readings delivered</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />2 minutes
          <span aria-hidden="true">&bull;</span> Free
        </span>
      </motion.div>

      {/* Decorative zodiac strip */}
      <motion.div
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        aria-hidden="true"
        className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 text-sm text-[rgba(232,228,245,0.28)]"
      >
        {ZODIAC_SIGNS.map((sign) => (
          <span
            key={sign.name}
            className="flex h-6 w-6 items-center justify-center"
          >
            {sign.symbol}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
