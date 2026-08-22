"use client";

// Conversa com a Master Aura para experiências do PRODUTO (rituais, sonhos,
// vidas passadas). Mesmo formato dos funis — mensagem pessoal → pergunta →
// resposta → pequena reação → próxima — sem LP nem venda. Devolve as
// respostas como id → rótulo (é o que a IA recebe), nunca texto livre
// longo, exceto o passo "text" explícito (sonho), que vai só ao endpoint.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const AURA_PHOTO = "/brand/master-aura.webp";
const TYPE_MS_PER_CHAR = 22;
const TYPE_MIN_MS = 600;
const TYPE_MAX_MS = 2000;

export interface ChatStep {
  id: string;
  aura: string[];
  question: string;
  options?: Array<{ id: string; label: string; reaction?: string }>;
  /** Passo de texto livre curto (ex.: o sonho). */
  text?: { placeholder: string; min?: number; max?: number };
  reaction?: string;
}

export interface ChatAnswers {
  /** id do passo → rótulo da opção (ou o texto, no passo "text"). */
  labels: Record<string, string>;
  /** id do passo → id da opção. */
  ids: Record<string, string>;
}

type Item = { kind: "aura"; text: string } | { kind: "me"; text: string };

export default function AuraChat({
  steps,
  intro,
  outro,
  onComplete,
  onStep,
}: {
  steps: ChatStep[];
  /** Mensagens de abertura antes da primeira pergunta. */
  intro?: string[];
  /** Mensagem após a última resposta (enquanto a IA trabalha). */
  outro?: string;
  onComplete: (answers: ChatAnswers) => void;
  onStep?: (stepId: string, optionId: string) => void;
}) {
  const [thread, setThread] = useState<Item[]>([]);
  const [typing, setTyping] = useState(false);
  const [index, setIndex] = useState(-1);
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState("");
  const answersRef = useRef<ChatAnswers>({ labels: {}, ids: {} });
  const timers = useRef<number[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const auraSays = useCallback(
    (messages: string[], then?: () => void) => {
      let delay = 200;
      for (const msg of messages) {
        const dur = Math.min(TYPE_MAX_MS, Math.max(TYPE_MIN_MS, msg.length * TYPE_MS_PER_CHAR));
        later(() => setTyping(true), delay);
        later(() => {
          setTyping(false);
          setThread((t) => [...t, { kind: "aura", text: msg }]);
        }, delay + dur);
        delay += dur + 350;
      }
      if (then) later(then, delay + 100);
    },
    [later]
  );

  const ask = useCallback(
    (i: number) => {
      const s = steps[i];
      if (!s) return;
      setIndex(i);
      auraSays([...s.aura, s.question], () => setShowInput(true));
    },
    [auraSays, steps]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (intro?.length) auraSays(intro, () => ask(0));
    else ask(0);
    return () => {
      for (const t of timers.current) window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, typing, showInput]);

  const finish = useCallback(
    (reaction: string | undefined) => {
      const next = index + 1;
      const go = () => {
        if (next >= steps.length) {
          if (outro) auraSays([outro]);
          onComplete(answersRef.current);
        } else ask(next);
      };
      if (reaction) auraSays([reaction], go);
      else later(go, 500);
    },
    [ask, auraSays, index, later, onComplete, outro, steps.length]
  );

  const choose = (optId: string, label: string, reaction?: string) => {
    if (!showInput) return;
    const s = steps[index];
    setShowInput(false);
    answersRef.current.labels[s.id] = label;
    answersRef.current.ids[s.id] = optId;
    setThread((t) => [...t, { kind: "me", text: label }]);
    onStep?.(s.id, optId);
    finish(reaction ?? s.reaction);
  };

  const sendText = () => {
    const s = steps[index];
    const v = text.trim();
    if (!showInput || !s?.text || v.length < (s.text.min ?? 12)) return;
    setShowInput(false);
    answersRef.current.labels[s.id] = v.slice(0, s.text.max ?? 1500);
    answersRef.current.ids[s.id] = "text";
    setThread((t) => [...t, { kind: "me", text: v }]);
    setText("");
    onStep?.(s.id, "text");
    finish(s.reaction);
  };

  const current = steps[index];
  const progress = steps.length ? Math.min(1, Math.max(0, index) / steps.length) : 0;

  return (
    <section className="mx-auto w-full max-w-lg">
      {/* progresso discreto */}
      <div className="mb-4 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] to-[#d4af37]"
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
      </div>

      <div className="space-y-3 pb-4">
        {thread.map((item, i) =>
          item.kind === "aura" ? (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
              <Image src={AURA_PHOTO} alt="" width={56} height={56} className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]" />
              <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[15px] leading-snug text-[#e8e4f5]">
                {item.text}
              </p>
            </motion.div>
          ) : (
            <motion.div key={i} initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex justify-end">
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-gradient-to-br from-[#d4af37] to-[#a9822f] px-4 py-2.5 text-[15px] font-medium leading-snug text-[#1a1330]">
                {item.text}
              </p>
            </motion.div>
          )
        )}
        {typing && (
          <div className="flex items-end gap-2">
            <Image src={AURA_PHOTO} alt="" width={56} height={56} className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-[rgba(212,175,55,0.5)]" />
            <span className="flex gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-3">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" style={{ animationDelay: `${d * 120}ms` }} />
              ))}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <AnimatePresence>
        {showInput && current && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-2.5 pb-6">
            {current.text ? (
              <div className="glass rounded-2xl p-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, current.text?.max ?? 1500))}
                  placeholder={current.text.placeholder}
                  rows={5}
                  autoFocus
                  className="w-full resize-none rounded-xl bg-transparent px-2 py-1.5 text-[15px] leading-snug text-[#e8e4f5] placeholder:text-white/35 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={sendText}
                  disabled={text.trim().length < (current.text.min ?? 12)}
                  className="btn-gold mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  Send to Master Aura
                </button>
              </div>
            ) : (
              current.options?.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => choose(opt.id, opt.label, opt.reaction)}
                  className="glass rounded-2xl px-4 py-3.5 text-left text-[15px] leading-snug text-[#e8e4f5] transition-all hover:border-[rgba(212,175,55,0.4)] active:scale-[0.98]"
                >
                  {opt.label}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
