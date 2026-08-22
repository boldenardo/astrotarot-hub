// Conversa da Master Aura antes de cada ritual (produto). Curta: 3 passos
// (cord-cutting: 6). Cada passo qualifica, aprofunda ou personaliza —
// os rótulos escolhidos vão para a IA como contexto; ids para analytics.

import type { ChatStep } from "@/components/experiences/AuraChat";
import type { RitualType } from "./types";

const LUCK_INTENT: ChatStep = {
  id: "intention",
  aura: ["Before I lay anything down — tell me honestly.", "Not what you think you should want. What you actually want."],
  question: "What do you want to invite into your life right now?",
  options: [
    { id: "luck", label: "Luck — I just need things to line up for once", reaction: "Then we won't chase luck tonight. We'll make room for it." },
    { id: "money", label: "Money — breathing room, not just more", reaction: "Breathing room. That word tells me more than a number would." },
    { id: "love", label: "Love — but without the chasing", reaction: "Without the chasing. Good. That's the only version worth inviting." },
    { id: "career", label: "Career — a door that finally opens", reaction: "Doors. Tonight is about where you stand when one opens." },
    { id: "beginning", label: "A new beginning — I'm ready to close something", reaction: "Closing is also an opening. We'll honor both." },
    { id: "protection", label: "Protection — I've felt exposed lately", reaction: "Then tonight we build the room around you first." },
  ],
};

const TIMING: ChatStep = {
  id: "timing",
  aura: ["There's a reason this is the moment you came."],
  question: "Which of these is closest to how things feel lately?",
  options: [
    { id: "almost", label: "Things go almost right, then slip at the last second" },
    { id: "stuck", label: "Nothing is wrong — nothing moves either" },
    { id: "scattered", label: "Too many doors, none of them mine" },
    { id: "late", label: "Good things come, but always a step too late" },
  ],
  reaction: "That pattern has a shape. Your ritual will be built around it, not around a wish.",
};

const TRIED: ChatStep = {
  id: "tried",
  aura: ["One more, and I'll start."],
  question: "What have you already tried?",
  options: [
    { id: "pushed", label: "Pushed harder — it only tired me" },
    { id: "waited", label: "Waited for a sign — still waiting" },
    { id: "planned", label: "Planned everything — life didn't read the plan" },
    { id: "nothing", label: "Honestly, nothing yet. This is the first thing" },
  ],
  reaction: "Good. Then tonight is the opposite of forcing. Let me write yours.",
};

const CORD: ChatStep[] = [
  {
    id: "who",
    aura: ["I won't ask for a name. The cards don't need it.", "But I do need to know what this is."],
    question: "Who is the person you can't stop thinking about?",
    options: [
      { id: "ex", label: "Someone I was with" },
      { id: "almost", label: "Someone it never quite became" },
      { id: "friend", label: "A friend who drifted, or was lost" },
      { id: "family", label: "Someone in my family" },
    ],
    reaction: "Okay. I'll hold that while we go.",
  },
  {
    id: "since",
    aura: ["Time matters less than you'd think — but it tells me how deep the groove is."],
    question: "How long has it been since it was really 'alive'?",
    options: [
      { id: "weeks", label: "Weeks" },
      { id: "months", label: "Months" },
      { id: "years", label: "Years — and it still visits" },
      { id: "never", label: "It never had a clean ending to count from" },
    ],
    reaction: "That answer is important. A thought that outlives its timeline isn't about time at all.",
  },
  {
    id: "shows",
    aura: ["Tell me how it shows up. Not how it should."],
    question: "Where does this person appear most?",
    options: [
      { id: "night", label: "At night, right before sleep" },
      { id: "dreams", label: "In dreams I didn't ask for" },
      { id: "compare", label: "In how I measure everyone else" },
      { id: "replay", label: "In conversations I keep replaying" },
    ],
    reaction: "People usually describe one of two patterns here — yours is the quieter, deeper one.",
  },
  {
    id: "unsaid",
    aura: ["Now the part nobody asks."],
    question: "If you could say one thing, which would it be?",
    options: [
      { id: "why", label: "\"Why?\"" },
      { id: "sorry", label: "\"I'm sorry\"" },
      { id: "enough", label: "\"Was I enough?\"" },
      { id: "stay", label: "\"I wanted you to stay\"" },
    ],
    reaction: "That sentence is the thread. Not the person — the sentence.",
  },
  {
    id: "holding",
    aura: ["Be gentle with yourself on this one."],
    question: "What are you actually holding onto?",
    options: [
      { id: "version", label: "The version of me I was with them" },
      { id: "promise", label: "Something that was promised and never came" },
      { id: "ending", label: "The ending I never got" },
      { id: "hope", label: "A hope I don't admit out loud" },
    ],
    reaction: "Naming it is already half the release. The ritual does the other half.",
  },
  {
    id: "ready",
    aura: ["Last one."],
    question: "Tonight, what do you want from this ritual?",
    options: [
      { id: "peace", label: "Peace — to sleep without the replay" },
      { id: "close", label: "To close it on my own terms" },
      { id: "keep", label: "To keep the good and set down the rest" },
      { id: "free", label: "To feel like myself again" },
    ],
    reaction: "Then that's what I'll write toward. Give me a moment.",
  },
];

const GENERIC: Record<Exclude<RitualType, "luck" | "cord-cutting">, ChatStep> = {
  money: {
    id: "money_pattern",
    aura: ["Money has a rhythm in every life. Tell me yours."],
    question: "Which is closest to how money behaves for you?",
    options: [
      { id: "leaks", label: "It comes, and leaves before I notice" },
      { id: "fear", label: "There's enough — and I'm still afraid" },
      { id: "loop", label: "Every month ends the same way" },
      { id: "ask", label: "I don't know how to ask for more" },
    ],
    reaction: "That's not a number problem. Your ritual will speak to the rhythm, not the sum.",
  },
  love: {
    id: "love_pattern",
    aura: ["Opening is different from chasing. Let me see which one you've been doing."],
    question: "Lately, love has felt…",
    options: [
      { id: "far", label: "Far away, like it's for other people" },
      { id: "guarded", label: "Possible, but I keep the door half closed" },
      { id: "tired", label: "Like effort I'm tired of making" },
      { id: "ready", label: "Closer than ever — I just don't want to force it" },
    ],
    reaction: "Good. Tonight we open a window, not a door someone has to walk through.",
  },
  protection: {
    id: "drain",
    aura: ["No curses here. Just honesty."],
    question: "What has been draining you lately?",
    options: [
      { id: "people", label: "A relationship that takes more than it gives" },
      { id: "work", label: "Work that follows me home" },
      { id: "stress", label: "Stress I can't name" },
      { id: "doubt", label: "My own self-doubt" },
    ],
    reaction: "Then that's what the circle is built against — not an enemy, a leak.",
  },
  "energy-cleanse": {
    id: "heavy",
    aura: ["Tell me where it sits."],
    question: "Where do you feel the heaviness most?",
    options: [
      { id: "home", label: "At home — the space feels stale" },
      { id: "body", label: "In my body — tired without reason" },
      { id: "mind", label: "In my head — noise that won't settle" },
      { id: "heart", label: "In my chest — something I carried from someone" },
    ],
    reaction: "Water, salt and breath handle that better than willpower does. Let me write it.",
  },
  "new-beginning": {
    id: "closing",
    aura: ["A beginning is honest only if something gets closed first."],
    question: "What are you closing?",
    options: [
      { id: "relationship", label: "A relationship" },
      { id: "job", label: "A job or a place" },
      { id: "self", label: "A version of myself" },
      { id: "habit", label: "A habit that ran me" },
    ],
    reaction: "Then tonight has two halves. We'll give the first one its due.",
  },
  moon: {
    id: "moon_ask",
    aura: ["Tonight's moon is already part of this. Tell me what you bring to it."],
    question: "What do you want to work with tonight?",
    options: [
      { id: "release", label: "Releasing something" },
      { id: "invite", label: "Inviting something" },
      { id: "clarity", label: "Seeing something clearly" },
      { id: "rest", label: "Resting, finally" },
    ],
    reaction: "The moon will pick the tone; you'll pick the intention. Let me write it.",
  },
};

export function ritualSteps(type: RitualType): ChatStep[] {
  if (type === "luck") return [LUCK_INTENT, TIMING, TRIED];
  if (type === "cord-cutting") return CORD;
  return [GENERIC[type], TIMING, TRIED];
}

export const RITUAL_INTRO: Record<RitualType, string[]> = {
  luck: ["Three questions. Then I write a ritual that's yours — not a template."],
  money: ["Three questions. No spreadsheet. Just the rhythm."],
  love: ["Three questions. Then a ritual for opening, not chasing."],
  "cord-cutting": ["I'm going to read this connection from your side first. Then we release what's yours to release.", "Six short questions. Answer the true one, not the nice one."],
  protection: ["Three questions. Then we build the room around you."],
  "energy-cleanse": ["Three questions. Then we clear it properly."],
  "new-beginning": ["Three questions. Then we close one door the right way."],
  moon: ["Three questions. The moon does the rest."],
};
