"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Clock } from "lucide-react";
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
        className="mb-6 flex flex-col items-center gap-3"
      >
        <Image
          src="/brand/astrotarot-logo.png"
          alt="AstroTarot"
          width={104}
          height={104}
          priority
          className="h-20 w-20 object-contain drop-shadow-[0_0_22px_rgba(212,175,55,0.4)]"
        />
        <span className="inline-flex items-center rounded-full border border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.06)] px-4 py-1.5 text-xs font-medium text-[#e8d9a8]">
          Free Soulmate Tarot Reading
        </span>
      </motion.div>

      <motion.h1
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-balance text-4xl leading-tight sm:text-5xl"
      >
        Ready to discover{" "}
        <span className="text-gold">who your soulmate is</span>?
      </motion.h1>

      <motion.p
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-4 max-w-md text-balance text-base text-[#b9b2d0]"
      >
        Answer 8 quick questions, draw your cards, and let your birth chart
        reveal their traits &mdash; and{" "}
        <span className="font-medium text-[#e8d9a8]">when your paths cross</span>.
      </motion.p>

      {/* Luna introduction */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-4 flex items-center gap-2.5 text-sm text-[#b9b2d0]"
      >
        <Image
          src="/luna.jpg"
          alt="Master Aura"
          width={56}
          height={56}
          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
        />
        <span>
          Guided by{" "}
          <span className="font-medium text-[#e8d9a8]">Master Aura</span>{" "}
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

      {/* Trust row — rostos de membros + rating */}
      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mt-6 flex flex-col items-center gap-2.5 text-sm text-[#b9b2d0]"
      >
        <span className="flex items-center">
          <span className="flex -space-x-2" aria-hidden="true">
            {[
              "/testimonials/t2.jpg",
              "/testimonials/t4.jpg",
              "/testimonials/t6.jpg",
              "/testimonials/t8.jpg",
            ].map((src) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={56}
                height={56}
                className="h-8 w-8 rounded-full border-2 border-[#161027] object-cover"
              />
            ))}
          </span>
          <span className="ml-2.5 flex items-center gap-1.5">
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
            <span>120,000+ readings</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />2 minutes
          <span aria-hidden="true">&bull;</span> Free
        </span>
      </motion.div>

      {/* Mini prova social — uma voz real antes de começar */}
      <motion.figure
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="glass mt-6 w-full max-w-sm rounded-2xl p-4 text-left"
      >
        <blockquote className="text-sm leading-relaxed text-[#d6d0e8]">
          &ldquo;The soulmate reading described him before we even met &mdash;
          down to details that still give me chills. Six months later, he
          walked into my life.&rdquo;
        </blockquote>
        <figcaption className="mt-3 flex items-center gap-2.5">
          <Image
            src="/testimonials/t4.jpg"
            alt="Jessica L."
            width={64}
            height={64}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]"
          />
          <span className="text-xs text-[#b9b2d0]">
            Jessica L. &mdash; Miami, FL
          </span>
        </figcaption>
      </motion.figure>

      {/* Decorative zodiac strip */}
      <motion.div
        custom={7}
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
