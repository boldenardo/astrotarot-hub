// Config da variante INTIMACY — copy gerada pela execução dos
// agentes originais do Ignite System (01-ICP → 03-Validador → 06-Hook
// Writer → 08-LP Copywriter) e passada por revisão adversarial de claims.
// Score do Validador: 7.5 — AVANCA COM AJUSTES.
//
// Vendemos LEITURA, nunca desfecho: nada aqui promete resultado externo.
// Estrutura obrigatória do LP Copywriter validada por script no build
// deste arquivo (3 parágrafos, 5 critérios, 4 FAQs, 7 interações).

import type { PainFunnelConfig } from "./types";

export const INTIMACY_CONFIG: PainFunnelConfig = {
  "segment": "intimacy",
  "pageTitle": "A Private Reading About What Changed",
  "hook": {
    "line": "The worst part might not be what happens in the moment. It's carrying the fear that it will happen again.",
    "sub": "Seven private questions. No names for anything you don't choose. Then one card shows you the pattern behind it.",
    "cta": "See if this pattern is mine"
  },
  "quiz": [
    {
      "id": "q1",
      "stage": "reconhecimento",
      "aura": [
        "I'm Master Aura. I've sat with more men in your exact position than you'd believe, so let me skip the small talk.",
        "Something shifted for you. Not around you — in you.",
        "Just pick an answer. You never have to explain anything here. Not to me, not to anyone."
      ],
      "question": "When did you first notice you didn't quite feel like yourself in your closest moments?",
      "options": [
        {
          "id": "q1a",
          "label": "A few months ago — and I keep waiting for it to pass",
          "pattern": "p_anticipation"
        },
        {
          "id": "q1b",
          "label": "About a year, maybe more. I've started studying myself",
          "pattern": "p_observer"
        },
        {
          "id": "q1c",
          "label": "Long enough that I stopped counting",
          "pattern": "p_retreat"
        },
        {
          "id": "q1d",
          "label": "Hard to say. I hide it so well I almost fooled myself",
          "pattern": "p_mask"
        }
      ]
    },
    {
      "id": "q2",
      "stage": "pensamento",
      "aura": [
        "Here's something men don't admit, even to themselves:",
        "the moment itself passes. The thought it leaves behind doesn't."
      ],
      "question": "Which thought stays the longest after a moment that didn't go the way you wanted?",
      "options": [
        {
          "id": "q2a",
          "label": "'What if it happens again?'",
          "pattern": "p_anticipation"
        },
        {
          "id": "q2b",
          "label": "'She noticed. I know she noticed.'",
          "pattern": "p_mask"
        },
        {
          "id": "q2c",
          "label": "'I wasn't like this before.'",
          "pattern": "p_observer"
        },
        {
          "id": "q2d",
          "label": "'Easier to just avoid the situation next time.'",
          "pattern": "p_retreat"
        }
      ],
      "reaction": "That thought you just picked — you've never once said it out loud, have you. That's exactly how it grew this strong, my dear. Silence is a greenhouse."
    },
    {
      "id": "q3",
      "stage": "antecipacao",
      "aura": [
        "Now the part nobody sees.",
        "Before anything even begins — the walk to the bedroom, the way she looks at you across the couch —"
      ],
      "question": "Where does your mind go in the hours before you might be close to her?",
      "options": [
        {
          "id": "q3a",
          "label": "It replays the last time on a loop",
          "pattern": "p_observer"
        },
        {
          "id": "q3b",
          "label": "It starts calculating: tonight? not tonight?",
          "pattern": "p_anticipation"
        },
        {
          "id": "q3c",
          "label": "It quietly looks for an exit — an excuse, a delay",
          "pattern": "p_retreat"
        },
        {
          "id": "q3d",
          "label": "It rehearses how to look relaxed",
          "pattern": "p_mask"
        }
      ]
    },
    {
      "id": "q4",
      "stage": "antecipacao",
      "aura": [
        "One more like that. Be honest —",
        "it's 2am somewhere inside this question."
      ],
      "question": "When you can't sleep, which question circles the longest?",
      "options": [
        {
          "id": "q4a",
          "label": "'What does this say about me?'",
          "pattern": "p_observer"
        },
        {
          "id": "q4b",
          "label": "'How long can I keep this from her?'",
          "pattern": "p_mask"
        },
        {
          "id": "q4c",
          "label": "'Is tonight's peace real, or just a countdown?'",
          "pattern": "p_anticipation"
        },
        {
          "id": "q4d",
          "label": "'Would it be easier if we just... stopped?'",
          "pattern": "p_retreat"
        }
      ]
    },
    {
      "id": "q5",
      "stage": "comportamento",
      "aura": [
        "Patterns hide inside habits.",
        "Yours has a favorite one — and you probably never noticed when it started."
      ],
      "question": "Which of these has quietly become part of your routine?",
      "options": [
        {
          "id": "q5a",
          "label": "Going to bed later than her — 'just finishing something'",
          "pattern": "p_retreat"
        },
        {
          "id": "q5b",
          "label": "A drink first, to take the edge off the waiting",
          "pattern": "p_anticipation"
        },
        {
          "id": "q5c",
          "label": "Being extra affectionate everywhere except the bedroom",
          "pattern": "p_mask"
        },
        {
          "id": "q5d",
          "label": "Reading her mood, her signals — planning around them",
          "pattern": "p_observer"
        }
      ],
      "reaction": "You know she's noticed the routine, don't you. Women don't miss patterns — they just decide not to name them. Which is its own kind of loneliness. For both of you."
    },
    {
      "id": "q6",
      "stage": "identidade",
      "aura": [
        "Now the real question. Not what you do —",
        "who you've become while doing it."
      ],
      "question": "Which of these feels closest to who you are these days?",
      "options": [
        {
          "id": "q6a",
          "label": "The man who watches himself from the outside",
          "pattern": "p_observer"
        },
        {
          "id": "q6b",
          "label": "The man who performs 'fine' all day long",
          "pattern": "p_mask"
        },
        {
          "id": "q6c",
          "label": "The man permanently braced for the next time",
          "pattern": "p_anticipation"
        },
        {
          "id": "q6d",
          "label": "The man who has slowly, quietly gone distant",
          "pattern": "p_retreat"
        }
      ]
    },
    {
      "id": "q7",
      "stage": "medo",
      "aura": [
        "Last one.",
        "Every man carries one fear bigger than the rest. Naming it is how you finally get to look at it instead of being looked at by it."
      ],
      "question": "What's the fear underneath all of it?",
      "options": [
        {
          "id": "q7a",
          "label": "That she'll draw her own conclusions — in silence",
          "pattern": "p_mask"
        },
        {
          "id": "q7b",
          "label": "That the fear itself makes it happen. A loop I can't exit",
          "pattern": "p_anticipation"
        },
        {
          "id": "q7c",
          "label": "That this version of me is permanent now",
          "pattern": "p_observer"
        },
        {
          "id": "q7d",
          "label": "That one day we stop trying — and neither of us says why",
          "pattern": "p_retreat"
        }
      ]
    }
  ],
  "transition": [
    "Thank you for answering straight. It would have been easy to take this with your armor on — you didn't, and that changes what I can see.",
    "Here's what I see already: this was never about the moments themselves. It's about the pattern your mind runs AROUND them — before, during, after. That pattern has a shape. Shapes are exactly what the cards read.",
    "The Egyptian deck doesn't predict, and it doesn't judge. It mirrors. Pick the card your hand moves toward first — your choice tells me where the pattern lives, and I'll show you what it can mean."
  ],
  "patterns": [
    {
      "id": "p_anticipation",
      "label": "The Anticipation Loop",
      "description": "Your mind runs the next time before it arrives — counting down, calculating, bracing. The fear of recurrence has become louder than anything that actually happens."
    },
    {
      "id": "p_observer",
      "label": "The Watchful Mind",
      "description": "Part of you stepped outside and started watching. You monitor yourself in the moments that used to be effortless, and the watching itself is what keeps you from being there."
    },
    {
      "id": "p_retreat",
      "label": "The Quiet Retreat",
      "description": "You didn't decide to pull away — it happened one small avoidance at a time. Later nights, convenient excuses, distance dressed up as tiredness."
    },
    {
      "id": "p_mask",
      "label": "The Steady Mask",
      "description": "You perform 'fine' so well that no one asks. The mask protects you in every room of the house — and isolates you in the one that matters."
    }
  ],
  "cards": [
    {
      "number": 7,
      "name": "The Chariot",
      "interpretation": "This card can symbolize a man holding the reins so tightly that the ride itself becomes work. Within your reading, it often points to control taken up as protection — and the quiet exhaustion of never letting the grip loosen. It asks where mastery ends and bracing begins.",
      "patternLine": "Within {pattern}, The Chariot suggests the tension you carry into the room may be the very thing steering the nights you're trying to protect."
    },
    {
      "number": 9,
      "name": "The Hermit",
      "interpretation": "This card can symbolize a retreat that began as self-protection and quietly became a residence. Within your reading, it often speaks to what a man learns in his own silence — and the moment that silence stops serving him.",
      "patternLine": "Within {pattern}, The Hermit suggests the distance you've been keeping may be asking to be understood before it hardens into habit."
    },
    {
      "number": 11,
      "name": "Strength",
      "interpretation": "This card can symbolize a quieter kind of power — not force, but the steadiness to face what the mind keeps circling. Within your reading, it often appears for men who have been strong for everyone except themselves.",
      "patternLine": "Within {pattern}, Strength suggests the courage you've been spending on hiding is the same courage that can carry you through naming it."
    },
    {
      "number": 18,
      "name": "The Moon",
      "interpretation": "This card can symbolize the space between what is real and what the mind projects onto the dark. Within your reading, it often points to fears rehearsed so many times they begin to feel like memories.",
      "patternLine": "Within {pattern}, The Moon suggests much of what you brace for may live in anticipation rather than in fact — and that is a door, not a wall."
    }
  ],
  "openLoop": {
    "surfaceLine": "What you just read is the surface — the part of the pattern that shows in daylight. The part that runs your nights sits underneath it.",
    "card2": "The next layer of your full reading looks at where the pattern took root: the moment your mind decided that bracing was safer than being present.",
    "card3": "The deepest layer goes where a free preview can't: what the pattern is protecting you from — and what it's quietly costing you with her.",
    "cta": "Your full Quiet Pattern reading is ready the moment you are. $9.99 a month — the complete reading in minutes, then unlimited readings for every question you'd never ask out loud. Begin now."
  },
  "lp": {
    "headline": "Your full reading of the pattern behind 'what if it happens again?' — in the next 10 minutes with the Quiet Pattern Method, even if you've never touched a tarot card.",
    "subheadline": "In minutes, a private written reading that names the pattern your mind runs before, during, and after — so you finally have words for the thing you've been carrying alone.",
    "connection": [
      "You've been told this is something a man fixes alone, in silence, through sheer will. But willpower is exactly how you've fought it for months — and the pattern is still setting the terms of your nights.",
      "There's a version of you she remembers. Present, unguarded, easy in his own skin. That man isn't gone. He's underneath a pattern that has never once been named out loud.",
      "You've tried not thinking about it. You've tried timing things, avoiding things, rehearsing calm. Trying harder inside the same loop only pulls it tighter — you can't out-muscle a pattern you've never seen."
    ],
    "comparison": [
      {
        "criterion": "The 2am question",
        "without": "Circles for hours and never lands on an answer",
        "with": "Named, mapped, and put into words you can actually work with"
      },
      {
        "criterion": "What you know about the pattern",
        "without": "Only that it keeps happening",
        "with": "Its shape, its trigger, and what it's trying to protect"
      },
      {
        "criterion": "Talking about it",
        "without": "Impossible — not to her, not to a friend, not to anyone",
        "with": "A private written reading. No conversations, no face to face, no one to explain yourself to"
      },
      {
        "criterion": "The hours before intimacy",
        "without": "Rehearsal, mental math, escape routes",
        "with": "A frame for what your mind is doing — and why it does it"
      },
      {
        "criterion": "The next four questions on your mind",
        "without": "Stay locked in your head",
        "with": "Asked freely, answered personally, whenever you're ready"
      }
    ],
    "authority": "Over 120,000 readings delivered, rated 4.9 by the people who received them. Every reading combines the Egyptian tarot deck with your quiz answers and the card your hand chose, so the interpretation is built around you — not copied from a generic card meaning. Your quiz answers set the context. The card you chose sets the door. No live calls, no appointments, nothing to explain to a stranger.",
    "value": [
      {
        "benefit": "Finally have words for the thing you've never said out loud",
        "feature": "Your full personalized reading of the dominant pattern from your quiz — then unlimited readings, whenever the question returns"
      },
      {
        "benefit": "Understand what your mind does before, during, and after — not just that it does it",
        "feature": "Interpretation built on your quiz answers and your chosen card — written for you, not copied from a generic card meaning"
      },
      {
        "benefit": "Ask the questions you'd never ask a person — zero judgment, zero small talk",
        "feature": "Four additional readings on any question you choose"
      },
      {
        "benefit": "Move at your own pace — this isn't a program with homework",
        "feature": "Readings never expire; your account keeps every one, ready to reread"
      },
      {
        "benefit": "Somewhere to take the 2am question — any night, without waking anyone",
        "feature": "Spiritual Guide available 24/7 inside your account"
      }
    ],
    "priceLine": "All of this from just $9.99 a month — unlimited readings, cancel anytime in two taps. Prefer one payment? 6 months for $39.99 or a year for $59.99.",
    "guarantee": "Read your full reading. Sit with it for a full week. If it doesn't give you words for what you've been carrying, email us within 7 days and we refund every cent — no questions, no forms, no convincing us. You risk nothing but ten minutes.",
    "faq": [
      {
        "q": "How much time does this actually take?",
        "a": "A few moments to check out — your reading is delivered in minutes — it's delivered in minutes. It's written and private, so you read it when you want, as many times as you want. No calls, no scheduling."
      },
      {
        "q": "Does it work if I'm starting from zero — I've never done tarot in my life?",
        "a": "Especially then. You don't interpret anything yourself. You answered the quiz, you chose your card — we build the reading. You just read it."
      },
      {
        "q": "Will anyone ever know I did this?",
        "a": "No. Your reading is delivered privately by email and lives inside your own account. No one is notified, nothing is posted anywhere, and what you ask stays between you and the page."
      },
      {
        "q": "Why is it only $9.99?",
        "a": "Because the first reading is how you decide whether this deserves your trust. $9.99 a month, unlimited readings, cancel anytime in two taps — we'd rather earn every month than trap you into one."
      }
    ],
    "ctaB": "Your reading starts now — not someday. [Get my full reading — $9.99/mo] Unlimited readings. Delivered in minutes. Cancel anytime; 7-day full refund if it doesn't land. The pattern has run your nights long enough. Read it."
  }
};
