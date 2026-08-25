"use client";

// /rituals/[type] — conversa com a Aura → POST /api/experiences/ritual →
// RitualPlayer. Gate de login/créditos tratado na tela, sem formulário.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { RitualResult, RitualType } from "@/lib/experiences/types";
import { ritualSteps, RITUAL_INTRO } from "@/lib/experiences/ritual-steps";
import AuraChat, { type ChatAnswers } from "./AuraChat";
import RitualPlayer from "./RitualPlayer";
import { useExperienceCall, AuraWriting, GateNotice } from "./shell";

export default function RitualExperience({ type, title }: { type: RitualType; title: string }) {
  const [phase, setPhase] = useState<"intro" | "chat" | "loading" | "ritual">("intro");
  const [answers, setAnswers] = useState<ChatAnswers | null>(null);
  const { busy, gate, result, call, reset } = useExperienceCall<RitualResult>("rituals");

  useEffect(() => {
    trackEvent("experience_view", { category: "experience", feature: "rituals", label: type });
  }, [type]);

  const generate = useCallback(
    async (a: ChatAnswers) => {
      setPhase("loading");
      const intention = a.labels.intention ?? a.labels[Object.keys(a.labels)[0]] ?? "";
      const r = await call("/api/experiences/ritual", { type, intention, answers: a.labels });
      if (r) setPhase("ritual");
    },
    [call, type]
  );

  const onComplete = (a: ChatAnswers) => {
    setAnswers(a);
    trackEvent("experience_complete_chat", { category: "experience", feature: "rituals", label: type });
    void generate(a);
  };

  if (phase === "intro") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <button
          type="button"
          onClick={() => {
            trackEvent("experience_start", { category: "experience", feature: "rituals", label: type });
            setPhase("chat");
          }}
          className="btn-gold flex min-h-[54px] w-full items-center justify-center rounded-2xl text-base font-semibold"
        >
          Start with Master Aura
          <span aria-hidden className="ml-2">→</span>
        </button>
        <p className="mt-3 text-center text-[11px] text-white/40">
          {type === "cord-cutting" ? "6 short questions" : "3 short questions"} · a few minutes · for reflection and entertainment
        </p>
        <Link href="/rituals" className="mt-6 block text-center text-sm text-white/50 underline underline-offset-4">
          Choose a different ritual
        </Link>
      </div>
    );
  }

  if (phase === "chat") {
    return (
      <AuraChat
        steps={ritualSteps(type)}
        intro={RITUAL_INTRO[type]}
        outro={`Writing your ${title.toLowerCase()}…`}
        onComplete={onComplete}
        onStep={(id, opt) => trackEvent("experience_step", { category: "experience", feature: "rituals", label: type, step: id, answer_id: opt })}
      />
    );
  }

  if (phase === "loading" || (busy && !result)) {
    if (gate) {
      return (
        <GateNotice
          gate={gate}
          returnTo={`/rituals/${type}`}
          oneOff={
            type === "cord-cutting"
              ? { label: "Just The Cord Reading — $9 once", feature: "cord" }
              : undefined
          }
          onRetry={() => {
            reset();
            if (answers) void generate(answers);
          }}
        />
      );
    }
    return <AuraWriting text={`Master Aura is writing your ${title.toLowerCase()}…`} />;
  }

  if (result) return <RitualPlayer ritual={result} />;
  return null;
}
