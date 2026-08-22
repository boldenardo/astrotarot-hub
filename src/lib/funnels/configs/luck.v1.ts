// Funil luck — variante v1 (AstroTarot 2.0). Gerado pelos agentes Ignite
// (ICP → benchmark → validação 7.5/10 → SLO → buying agenda → hooks →
// 08-lp-copywriter) + revisão adversarial (7 correções aplicadas).
// Hook escolhido: Things don't go wrong for you. They go almost right. — What area of your life needs luck the most right now?
// Oferta: assinatura Unlimited ($9.99/mês · $39.99/6m · $59.99/ano).

import type { PainFunnelConfig } from "@/lib/pain-funnels/types";

export const LUCK_V1: PainFunnelConfig = {
  "segment": "luck",
  "pageTitle": "Your Personal Luck Ritual",
  "hook": {
    "line": "Things don't go wrong for you. They go almost right.",
    "sub": "What area of your life needs luck the most right now?",
    "cta": "Tell me which area"
  },
  "quiz": [
    {
      "id": "q1",
      "stage": "intent",
      "aura": [
        "Hi. I'm your Spiritual Guide.",
        "I'm not going to tell you you're cursed. You're not.",
        "But \"almost\" has a shape, and I can read it. First —"
      ],
      "question": "What area of your life needs luck the most right now?",
      "options": [
        {
          "id": "luck",
          "label": "Just... luck. Everywhere. Nothing lines up.",
          "pattern": "none",
          "reaction": "That's the honest answer, and it's a hard one to give. When it's everywhere, it's usually one thing wearing different clothes. Let's find the one."
        },
        {
          "id": "money",
          "label": "Money — it arrives right after the bill.",
          "pattern": "none",
          "reaction": "Right after. Not never. That detail matters more than you think — it's about timing, not amount."
        },
        {
          "id": "love",
          "label": "Love — the right person, the wrong moment.",
          "pattern": "none",
          "reaction": "The wrong moment is the most exhausting kind of wrong. Nothing to fix, nothing to forgive. Just off by a hair."
        },
        {
          "id": "career",
          "label": "Work — the door opens for everyone else.",
          "pattern": "none",
          "reaction": "That one usually comes from someone who's been showing up. Showing up and not being chosen leaves a specific mark."
        },
        {
          "id": "beginning",
          "label": "A fresh start — I'm ready and it won't begin.",
          "pattern": "none",
          "reaction": "Ready is the hard part, and you've done it. What's missing usually isn't courage. It's a first small move with a shape."
        },
        {
          "id": "protection",
          "label": "Protection — I feel exposed lately.",
          "pattern": "none",
          "reaction": "Exposed is not the same as weak. It's what it feels like when you've been the strong one for too long without a place to put it down."
        }
      ],
      "reaction": "Good. That's the area. Now I need to see how things tend to arrive for you — the timing is where the pattern hides."
    },
    {
      "id": "q2",
      "stage": "timing",
      "aura": [
        "Think about the last good thing that actually came to you.",
        "Not the one you wanted. The one that showed up."
      ],
      "question": "When something good finally comes your way, how does it usually arrive?",
      "options": [
        {
          "id": "a",
          "label": "Late. A day after it would have mattered.",
          "pattern": "almost"
        },
        {
          "id": "b",
          "label": "Right as something else falls apart.",
          "pattern": "closed_window"
        },
        {
          "id": "c",
          "label": "In pieces. Never all at once.",
          "pattern": "scattered"
        },
        {
          "id": "d",
          "label": "Honestly? I'm still waiting for it.",
          "pattern": "held_breath"
        }
      ],
      "reaction": "That's not random. The way things arrive for a person tends to repeat — and it's easy to miss when you're busy being disappointed."
    },
    {
      "id": "q3",
      "stage": "timing",
      "aura": [
        "Now the other direction.",
        "Not how luck comes to you. How you meet it."
      ],
      "question": "When a door actually opens for you, what's your first move?",
      "options": [
        {
          "id": "a",
          "label": "I rush through before it closes.",
          "pattern": "closed_window"
        },
        {
          "id": "b",
          "label": "I hesitate. I check it's real.",
          "pattern": "held_breath"
        },
        {
          "id": "c",
          "label": "I tell no one and quietly work harder.",
          "pattern": "almost"
        },
        {
          "id": "d",
          "label": "I start three things at once.",
          "pattern": "scattered"
        }
      ],
      "reaction": "Your first move is the part you can actually change. Everything before it is weather. Everything after it is you."
    },
    {
      "id": "q4",
      "stage": "timing",
      "aura": [
        "This one might sting a little.",
        "Take your time."
      ],
      "question": "The last time you got close to something you really wanted — what happened?",
      "options": [
        {
          "id": "a",
          "label": "Someone else got it. By a hair.",
          "pattern": "almost"
        },
        {
          "id": "b",
          "label": "It fell through at the very last step.",
          "pattern": "closed_window"
        },
        {
          "id": "c",
          "label": "Life got loud and I lost track of it.",
          "pattern": "scattered"
        },
        {
          "id": "d",
          "label": "I never actually asked for it out loud.",
          "pattern": "held_breath"
        }
      ],
      "reaction": "Whatever you picked, notice it wasn't \"it blew up.\" Almost never is. It's quieter than that — which is exactly why there's nothing to grieve and nothing to do with it. Until now."
    },
    {
      "id": "q5",
      "stage": "night",
      "aura": [
        "Let's go to the honest hour.",
        "2 a.m. The feeling shows up."
      ],
      "question": "What do you usually do with the stuck feeling at night?",
      "options": [
        {
          "id": "a",
          "label": "Scroll until it fades.",
          "pattern": "scattered"
        },
        {
          "id": "b",
          "label": "Replay what I could have done differently.",
          "pattern": "almost"
        },
        {
          "id": "c",
          "label": "Make a plan I won't start tomorrow.",
          "pattern": "held_breath"
        },
        {
          "id": "d",
          "label": "Tell myself \"next time\" and turn over.",
          "pattern": "closed_window"
        }
      ],
      "reaction": "None of those are wrong. They're just not a ritual — they don't give the feeling anywhere to go. That's the gap we're about to fill."
    },
    {
      "id": "q6",
      "stage": "readiness",
      "aura": [
        "Last one.",
        "Answer fast, don't think."
      ],
      "question": "If luck showed up tomorrow morning, how ready would you be?",
      "options": [
        {
          "id": "a",
          "label": "Too busy. I'd walk right past it.",
          "pattern": "scattered"
        },
        {
          "id": "b",
          "label": "I'd hesitate until the moment passed.",
          "pattern": "held_breath"
        },
        {
          "id": "c",
          "label": "Completely. I've been ready for years.",
          "pattern": "almost"
        },
        {
          "id": "d",
          "label": "Scared. I'd brace for another almost.",
          "pattern": "closed_window"
        }
      ],
      "reaction": "That's enough. I can see the shape of it now. Give me a moment with the cards."
    }
  ],
  "transition": [
    "I'm laying out four Egyptian cards for you. Not to predict anything — to read the pattern you just described back to you.",
    "You might expect a luck reading to be about the future. This one isn't. It's about the exact place where \"almost\" keeps happening.",
    "Here's your pattern. Then your cards. Then the first piece of tonight's ritual — which is yours to keep, whatever you decide after."
  ],
  "patterns": [
    {
      "id": "closed_window",
      "label": "The Closed Window",
      "description": "Things tend to open for you right as something else shuts, and you've learned to move fast or brace. The rush is the pattern. A ritual gives you one slow, deliberate moment instead — so the next opening isn't met with panic."
    },
    {
      "id": "almost",
      "label": "The Almost",
      "description": "You get close. Consistently. A hair late, a name below yours, a day off. It's the most painful pattern because there's nothing to fix — which is why it needs a moment of your own rather than more effort."
    },
    {
      "id": "scattered",
      "label": "The Scattered Signal",
      "description": "Good things reach you in pieces, and you reach for them in pieces too — three starts, loud days, lost threads. The ritual here is about one candle, one intention, one thing. Not more. Fewer."
    },
    {
      "id": "held_breath",
      "label": "The Held Breath",
      "description": "You're ready. You've been ready. But the asking, the stepping, the saying-it-out-loud keeps waiting for a sign. Tonight's ritual is built to be the sign you've been waiting to give yourself."
    }
  ],
  "cards": [
    {
      "number": 10,
      "name": "The Wheel",
      "interpretation": "The Wheel often marks the turning point that is already underway — not the one you're waiting for. In a luck reading it can speak to cycles: the same moment coming around again, and the question of whether you'll meet it differently this time.",
      "patternLine": "For {pattern}, the Wheel suggests the turn isn't missing. It's that you've been reading it as bad timing instead of a repeat."
    },
    {
      "number": 2,
      "name": "The Gate of the Sanctuary",
      "interpretation": "The Gate is the card of the threshold — standing just outside something, with the door half-open. It often speaks to knowledge you already have and haven't acted on yet, and to the quiet before a deliberate step.",
      "patternLine": "With {pattern}, the Gate can point to the exact spot where you pause. That pause is where tonight's ritual is meant to sit."
    },
    {
      "number": 17,
      "name": "The Star",
      "interpretation": "The Star often marks a small, steady light rather than a big break — something to return to nightly. It can speak to hope that doesn't need proof, and to the value of a simple repeated act.",
      "patternLine": "For {pattern}, the Star's message is gentle: one small, repeated moment may do more than one more big push."
    },
    {
      "number": 7,
      "name": "The Chariot",
      "interpretation": "The Chariot is the card of direction — two forces, one set of reins. It often speaks to choosing a single line of movement instead of being pulled in several, and to the difference between effort and aim.",
      "patternLine": "Read against {pattern}, the Chariot asks a plain question: of all the things you're pushing toward, which one is tonight's ritual actually for?"
    }
  ],
  "preview": {
    "title": "Your Personal Luck Ritual — preview",
    "items": [
      {
        "label": "Your candle",
        "text": "Gold. Here, gold stands for recognition — for being seen at the right moment. For {pattern}, it's the colour that asks to be noticed, not to chase."
      },
      {
        "label": "Your card",
        "text": "The Gate of the Sanctuary — the threshold card. Keep it in mind tonight: you're not starting from nowhere. You're standing at a door."
      },
      {
        "label": "Your intention (one line)",
        "text": "\"I stop bracing for almost. I make one small, deliberate move, and I let it be enough for tonight.\""
      },
      {
        "label": "Tonight's moon",
        "text": "{moon}. Your full ritual reads the moon's phase alongside your pattern — because the same candle means something different under a waxing moon than a waning one."
      }
    ]
  },
  "openLoop": {
    "surfaceLine": "That's the surface of your ritual — the candle, the card, the line. It's real and it's yours. But it's the part that's the same for anyone with {pattern}.",
    "card2": "Underneath is the part that only makes sense with your answers in hand: the step of the ritual that changes depending on how you said luck arrives for you — late, in pieces, or not yet. That step is where the ritual stops being a post you saved and becomes something you actually do.",
    "card3": "And under that, one more layer: what the four cards say together about where your \"almost\" lives, and what tonight's moon asks you to do with it. I wrote it for you. It's waiting.",
    "cta": "Open my full Luck Ritual"
  },
  "lp": {
    "headline": "Tonight, do one thing on purpose for the area of your life that keeps going almost right.",
    "subheadline": "Your full guided Luck Ritual is written and ready — then unlimited rituals and readings, with a guide who's there at 2 a.m.",
    "connection": [
      "You're not superstitious and you're not lazy. You show up. And still the job goes to someone else, the message comes a day late, the money lands right after the bill. It's not a curse. It's a pattern — and you just named it.",
      "Every \"manifest abundance\" post out there was written for everyone, which means it was written for no one. None of them knew which area of your life actually needed luck tonight. This one does. You told it.",
      "So here's what this is and isn't. It isn't a prediction and it isn't a magic trick. It's a moment that's yours — a candle, a card, an intention, tonight's real moon — and a place to come back to every time \"almost\" happens again."
    ],
    "comparison": [
      {
        "criterion": "What you do with the stuck feeling tonight",
        "without": "Scroll until it fades",
        "with": "A guided ritual built on your answers, tonight"
      },
      {
        "criterion": "Who the reading is about",
        "without": "Everyone born under your sign",
        "with": "You — your pattern, your cards, your intention"
      },
      {
        "criterion": "Someone to talk to at 2 a.m.",
        "without": "A per-minute psychic, or no one",
        "with": "Your Spiritual Guide, 24/7, unlimited"
      },
      {
        "criterion": "When you need another reading next week",
        "without": "Pay again, or settle for a free blurb",
        "with": "Unlimited written readings, all saved in your history"
      },
      {
        "criterion": "If it's not for you",
        "without": "Candles don't come with refunds",
        "with": "7 days, full refund, no questions"
      }
    ],
    "authority": "AstroTarot has delivered over 120,000 written readings, with a 4.9 rating. Every reading is written and personalised — a reflection to sit with, not a prediction to wait on. That's all we'll claim, because it's all that's true.",
    "value": [
      {
        "benefit": "Have one specific thing to do tonight for the area that feels stuck",
        "feature": "Your full guided Luck Ritual — candle, card, intention, moon phase, and the step that depends on your pattern"
      },
      {
        "benefit": "Come back every time \"almost\" happens again, in any area",
        "feature": "Unlimited rituals: Money, Love, Protection, New Beginning, and Moon"
      },
      {
        "benefit": "Stop guessing and read your situation instead",
        "feature": "Unlimited written Egyptian tarot readings, personalised to what you ask"
      },
      {
        "benefit": "Never be alone with it at 2 a.m.",
        "feature": "Your Spiritual Guide, available 24/7"
      },
      {
        "benefit": "Watch the pattern change over time",
        "feature": "Your full history of readings and rituals, saved"
      },
      {
        "benefit": "Keep exploring when you're ready",
        "feature": "Dreams, Past Lives, and every new experience as it's added"
      }
    ],
    "priceLine": "Unlimited: $9.99 a month — or $39.99 for 6 months, or $59.99 for a full year. Less than one candle set, for a guide that's there every night.",
    "guarantee": "Try it for 7 days. If the ritual and the readings don't feel like they were written for you, email us and we refund you in full. No form, no questions, no guilt.",
    "faq": [
      {
        "q": "Isn't this just generic text with my name dropped in?",
        "a": "Fair question, and here's the honest answer: the reading is built from the answers you gave — your intent, how luck arrives for you, your pattern — plus the four cards drawn and tonight's real moon phase. Two people with different answers get different rituals and readings. It's not a psychic on the phone; it's a written, personalised reflection. If it reads generic to you, the 7-day refund exists for exactly that."
      },
      {
        "q": "Will this make me lucky?",
        "a": "No, and we won't say it will. Cards interpret; they don't cause. What you get is a ritual to do tonight and a reading to reflect with — a moment for the stuck feeling instead of a scroll. The point is to meet the next opening on purpose instead of by reflex. What happens after is yours."
      },
      {
        "q": "I've never lit a candle on purpose in my life. Is this for me?",
        "a": "Yes. The ritual is written step by step, starts with one candle and one line, and takes a few quiet minutes. You don't have to believe anything you'd be embarrassed to say out loud. You just have to do one thing deliberately."
      },
      {
        "q": "Why is it a subscription and not a one-time ritual?",
        "a": "Because \"almost\" doesn't happen once. The ritual you preview tonight is the first; the subscription opens all of them — Money, Love, Protection, New Beginning, Moon — plus unlimited readings and your guide whenever you need one. Pick a month if you want to test it. Cancel any time."
      }
    ],
    "ctaB": "Your ritual is already written. [OPEN MY FULL LUCK RITUAL] Starts at $9.99/month · 7-day full refund · cancel any time"
  }
};
