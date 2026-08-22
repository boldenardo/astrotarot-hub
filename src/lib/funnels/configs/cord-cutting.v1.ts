// Funil cord-cutting — variante v1 (AstroTarot 2.0). Gerado pelos agentes Ignite
// (ICP → benchmark → validação 7.5/10 → SLO → buying agenda → hooks →
// 08-lp-copywriter) + revisão adversarial (7 correções aplicadas).
// Hook escolhido: You deleted the messages. So why are you still answering them in your head?
// Oferta: assinatura Unlimited ($9.99/mês · $39.99/6m · $59.99/ano).

import type { PainFunnelConfig } from "@/lib/pain-funnels/types";

export const CORDCUTTING_V1: PainFunnelConfig = {
  "segment": "cord",
  "pageTitle": "Your Connection — a reading for the person you stopped talking to",
  "hook": {
    "line": "You deleted the messages. So why are you still answering them in your head?",
    "sub": "Seven short questions. Four cards. One honest name for what you're still holding — and what may need to be set down.",
    "cta": "Start my reading"
  },
  "genderQuestionId": "gender",
  "quiz": [
    {
      "id": "gender",
      "stage": "opening",
      "aura": [
        "I'm going to ask you about someone you don't talk to anymore.",
        "Not to reopen it. To find out what's still open.",
        "First — who am I talking to?"
      ],
      "question": "Who am I talking to?",
      "options": [
        {
          "id": "woman",
          "label": "A woman",
          "pattern": "none",
          "reaction": "Okay. Then we're talking about him. I'll go slowly, and you can stop whenever you want."
        },
        {
          "id": "man",
          "label": "A man",
          "pattern": "none",
          "reaction": "Okay. Then we're talking about her. You don't have to explain anything to me. Just answer."
        }
      ],
      "reaction": "Good. Now the part nobody asks you."
    },
    {
      "id": "w_time",
      "gender": "woman",
      "stage": "timeline",
      "aura": [
        "Let's start with something simple."
      ],
      "question": "How long since you two actually talked?",
      "options": [
        {
          "id": "weeks",
          "label": "A few weeks",
          "pattern": "unfinished"
        },
        {
          "id": "months",
          "label": "Months",
          "pattern": "door"
        },
        {
          "id": "year",
          "label": "Over a year",
          "pattern": "verdict"
        },
        {
          "id": "lost",
          "label": "I've honestly lost count",
          "pattern": "proof"
        }
      ],
      "reaction": "However long it's been, the thought didn't get the memo. That's not weakness. It usually means something stopped without being closed."
    },
    {
      "id": "w_ending",
      "gender": "woman",
      "stage": "ending",
      "aura": [
        "This one matters more than it looks."
      ],
      "question": "How did it end?",
      "options": [
        {
          "id": "i_left",
          "label": "I ended it",
          "pattern": "verdict"
        },
        {
          "id": "he_left",
          "label": "{He} ended it",
          "pattern": "proof"
        },
        {
          "id": "faded",
          "label": "It faded. Nobody said it out loud",
          "pattern": "unfinished"
        },
        {
          "id": "repeat",
          "label": "It ended more than once",
          "pattern": "door"
        }
      ],
      "reaction": "Who ended it and who finished it are two different things. Whichever you chose, you already know which one is still open."
    },
    {
      "id": "w_symptom",
      "gender": "woman",
      "stage": "symptom",
      "aura": [
        "Now the part you don't say to friends anymore.",
        "Because they're tired of hearing it, and you're tired of being the one who still says it."
      ],
      "question": "What still shows up, uninvited?",
      "options": [
        {
          "id": "replay",
          "label": "I replay conversations and change what I said",
          "pattern": "unfinished"
        },
        {
          "id": "dream",
          "label": "I dream about {him} and wake up annoyed at myself",
          "pattern": "door"
        },
        {
          "id": "compare",
          "label": "I measure everyone new against {him}",
          "pattern": "mirror"
        },
        {
          "id": "check",
          "label": "I check whether {he}'s moved on",
          "pattern": "verdict"
        }
      ],
      "reaction": "That's the thought doing its job. It isn't trying to bring {him} back. It's trying to finish something you weren't allowed to finish."
    },
    {
      "id": "w_unsaid",
      "gender": "woman",
      "stage": "unsaid",
      "aura": [
        "If you could say one thing to {him} and {he} had to actually hear it."
      ],
      "question": "What would it be?",
      "options": [
        {
          "id": "enough",
          "label": "Why wasn't I enough?",
          "pattern": "verdict"
        },
        {
          "id": "sorry",
          "label": "I'm sorry",
          "pattern": "unfinished"
        },
        {
          "id": "meant",
          "label": "Did it mean anything to you?",
          "pattern": "proof"
        },
        {
          "id": "unknown",
          "label": "I don't know. That's the problem",
          "pattern": "mirror"
        }
      ],
      "reaction": "Notice it isn't a goodbye. It's something that still wants an answer. Things that end without one stay open. That's not you being weak. That's how unfinished things work."
    },
    {
      "id": "w_fear",
      "gender": "woman",
      "stage": "holding",
      "aura": [
        "Here's the one I actually need."
      ],
      "question": "If you truly let it go, what would that mean?",
      "options": [
        {
          "id": "nothing",
          "label": "That it didn't matter",
          "pattern": "proof"
        },
        {
          "id": "fault",
          "label": "That I was the problem",
          "pattern": "verdict"
        },
        {
          "id": "self",
          "label": "That I'd lose who I was with {him}",
          "pattern": "mirror"
        },
        {
          "id": "hope",
          "label": "That I'd have to stop hoping",
          "pattern": "door"
        }
      ],
      "reaction": "That's the thing you're holding. Not {him}. This. And it makes sense that you won't put it down until someone names it properly."
    },
    {
      "id": "w_status",
      "gender": "woman",
      "stage": "honesty",
      "aura": [
        "Last one. Be honest, I'm not keeping score."
      ],
      "question": "Out loud, where are you with it?",
      "options": [
        {
          "id": "over",
          "label": "Over it. Mostly.",
          "pattern": "mirror"
        },
        {
          "id": "night",
          "label": "Fine by day. Not at 2 a.m.",
          "pattern": "door"
        },
        {
          "id": "tired",
          "label": "Not over it, and tired of pretending",
          "pattern": "unfinished"
        },
        {
          "id": "lost",
          "label": "I don't know anymore",
          "pattern": "verdict"
        }
      ],
      "reaction": "Out loud and at 2 a.m. are two different rooms. This reading is for the second one."
    },
    {
      "id": "m_time",
      "gender": "man",
      "stage": "timeline",
      "aura": [
        "Start simple."
      ],
      "question": "How long since you two actually talked?",
      "options": [
        {
          "id": "weeks",
          "label": "A few weeks",
          "pattern": "unfinished"
        },
        {
          "id": "months",
          "label": "Months",
          "pattern": "door"
        },
        {
          "id": "year",
          "label": "Over a year",
          "pattern": "verdict"
        },
        {
          "id": "lost",
          "label": "Long enough that I shouldn't be here",
          "pattern": "proof"
        }
      ],
      "reaction": "You'd think time would have handled it. It didn't, which usually means something stopped without being closed. That's not a flaw. It's a loose end."
    },
    {
      "id": "m_ending",
      "gender": "man",
      "stage": "ending",
      "aura": [
        "This one matters more than it looks."
      ],
      "question": "How did it end?",
      "options": [
        {
          "id": "i_left",
          "label": "I ended it",
          "pattern": "verdict"
        },
        {
          "id": "she_left",
          "label": "{He} ended it",
          "pattern": "proof"
        },
        {
          "id": "faded",
          "label": "It faded. Nobody said it out loud",
          "pattern": "unfinished"
        },
        {
          "id": "repeat",
          "label": "It ended more than once",
          "pattern": "door"
        }
      ],
      "reaction": "Who ended it and who finished it aren't the same person. Whatever you chose, you already know which part is still open."
    },
    {
      "id": "m_symptom",
      "gender": "man",
      "stage": "symptom",
      "aura": [
        "Now the part you don't tell anyone.",
        "Not because it's shameful. Because there's nobody you'd say it to."
      ],
      "question": "When does {he} still show up?",
      "options": [
        {
          "id": "replay",
          "label": "I replay the last conversation and fix my side of it",
          "pattern": "unfinished"
        },
        {
          "id": "dream",
          "label": "I dream about {him} and it throws the whole day",
          "pattern": "door"
        },
        {
          "id": "compare",
          "label": "Every new person gets compared to {him}",
          "pattern": "mirror"
        },
        {
          "id": "check",
          "label": "I look {him} up. Then I hate that I did",
          "pattern": "verdict"
        }
      ],
      "reaction": "That's not you failing to move on. That's a thought trying to finish a job nobody let it finish."
    },
    {
      "id": "m_unsaid",
      "gender": "man",
      "stage": "unsaid",
      "aura": [
        "If you could say one thing and {he} had to actually hear it."
      ],
      "question": "What would it be?",
      "options": [
        {
          "id": "enough",
          "label": "What did I do wrong?",
          "pattern": "verdict"
        },
        {
          "id": "sorry",
          "label": "I should have said it sooner",
          "pattern": "unfinished"
        },
        {
          "id": "meant",
          "label": "Was it real for you?",
          "pattern": "proof"
        },
        {
          "id": "unknown",
          "label": "I don't know. That's what bothers me",
          "pattern": "mirror"
        }
      ],
      "reaction": "Notice it isn't a goodbye. It's something that still wants an answer. A thing that ends without one stays open. That's not weakness. That's how unfinished things work."
    },
    {
      "id": "m_fear",
      "gender": "man",
      "stage": "holding",
      "aura": [
        "Here's the one I actually need."
      ],
      "question": "If you truly let it go, what would that mean?",
      "options": [
        {
          "id": "nothing",
          "label": "That it didn't count",
          "pattern": "proof"
        },
        {
          "id": "fault",
          "label": "That it was my fault",
          "pattern": "verdict"
        },
        {
          "id": "self",
          "label": "That I'd lose the version of me {he} knew",
          "pattern": "mirror"
        },
        {
          "id": "hope",
          "label": "That I'd have to stop waiting",
          "pattern": "door"
        }
      ],
      "reaction": "That's what you're holding. Not {him}. This. And you won't put it down until it has a name, which is fair."
    },
    {
      "id": "m_status",
      "gender": "man",
      "stage": "honesty",
      "aura": [
        "Last one. I'm not keeping score."
      ],
      "question": "If someone asked, what would you say?",
      "options": [
        {
          "id": "over",
          "label": "I'm fine. I don't think about it.",
          "pattern": "mirror"
        },
        {
          "id": "night",
          "label": "Fine. Except late at night.",
          "pattern": "door"
        },
        {
          "id": "tired",
          "label": "Not fine, and tired of acting like it",
          "pattern": "unfinished"
        },
        {
          "id": "lost",
          "label": "I genuinely don't know",
          "pattern": "verdict"
        }
      ],
      "reaction": "What you'd say and what's true at night are two different rooms. This reading is for the second one."
    }
  ],
  "transition": [
    "Okay. I have what I need, and you didn't have to explain yourself once.",
    "I'm going to draw four cards against your answers. They won't tell me what {he} is thinking. They can't. They read you.",
    "Take a breath. This part is quiet."
  ],
  "patterns": [
    {
      "id": "unfinished",
      "label": "unfinished conversation",
      "description": "Something was never said, or was said wrong, and the mind keeps rewriting the scene to get it right."
    },
    {
      "id": "door",
      "label": "door left open",
      "description": "A quiet, unspoken 'what if' that keeps a light on for a return nobody has promised."
    },
    {
      "id": "mirror",
      "label": "borrowed version of yourself",
      "description": "The pull is less about the person and more about who you were when you were with them."
    },
    {
      "id": "verdict",
      "label": "unanswered question",
      "description": "The need to understand why, to hear a reason, before the story can be closed."
    },
    {
      "id": "proof",
      "label": "need to have mattered",
      "description": "Letting go feels like admitting it meant nothing, so the holding becomes the proof that it did."
    }
  ],
  "cards": [
    {
      "number": 18,
      "name": "The Twilight",
      "interpretation": "This card often marks the hour when the daytime version of you goes quiet and the other one starts talking. It can speak to thoughts that only feel true in the dark, and to the tiredness of arguing with them alone.",
      "patternLine": "Twilight is where your {pattern} comes out to talk."
    },
    {
      "number": 6,
      "name": "The Two Roads",
      "interpretation": "A figure standing at a fork, looking backward down one road while standing on the other. This card can speak to living in two directions at once, and to how exhausting it is to be half-turned for this long.",
      "patternLine": "Here, the road you keep glancing down is the {pattern}."
    },
    {
      "number": 9,
      "name": "The Veiled Lamp",
      "interpretation": "A small light held up to the past. This card often marks memory doing its editing: replaying, softening, sharpening. It can speak to the difference between what happened and the version you keep reviewing.",
      "patternLine": "The lamp shows what the replays hide: the {pattern}."
    },
    {
      "number": 14,
      "name": "The Two Urns",
      "interpretation": "Water poured from one vessel into another. This card can speak to release as a transfer, not a loss: nothing is thrown away, it simply changes where it lives. It often marks the moment setting something down stops feeling like betrayal.",
      "patternLine": "This card can speak to setting the {pattern} down without pretending it weighed nothing."
    }
  ],
  "preview": {
    "title": "Your Connection",
    "items": [
      {
        "label": "Emotional attachment",
        "text": "From your answers, the pull reads less like missing a person and more like the {pattern} your answers keep circling. That's why distance alone hasn't touched it: distance removes {him}, not the thing."
      },
      {
        "label": "Unfinished feelings",
        "text": "There's a sentence you never got to finish. The cards can't tell you how {he} would have answered it. They can show you why it still wants an answer."
      },
      {
        "label": "Recurring thoughts",
        "text": "The replays, the dreams, the comparisons: each one is the same {pattern} trying a different door. It isn't random, and it isn't a sign you're failing at moving on."
      },
      {
        "label": "What you're holding onto",
        "text": "Not {him}. The {pattern}. Naming it is the part nobody did for you, and it's the part this reading is for."
      },
      {
        "label": "What may need to be released",
        "text": "The Two Urns suggests the release here is symbolic, not a deletion: moving the {pattern} from the place it interrupts your sleep to a place you choose. Your full reading shows what that looks like for your answers, and walks you into the guided Cord Cutting Ritual."
      }
    ]
  },
  "openLoop": {
    "surfaceLine": "On the surface, the thought is about {him}. Your preview already shows it isn't, quite.",
    "card2": "Underneath that layer is the reason the thought picks 2 a.m.: what the Twilight and the Veiled Lamp say about the version of the story you keep editing, and what that editing is protecting.",
    "card3": "At the bottom is the part you answered in the last question: what letting go would mean. The Two Urns reads that fear directly, and the full reading ends with a symbolic release you can actually do tonight.",
    "cta": "Read the whole thing"
  },
  "lp": {
    "headline": "Put a name on what you're still holding. Then put it down.",
    "subheadline": "A written reading of your connection, built from your answers and four cards, plus somewhere to go the next time the thought comes back.",
    "connection": [
      "You said you were over it today. Out loud, to someone. Then it was late, and you were answering a message nobody sent. Nobody sees that part, which is exactly why it's the part that doesn't go away.",
      "Whatever you've tried, from distance to silence to telling yourself the story again, it treated the thought as the enemy. None of it asked what the thought was protecting.",
      "This reading asks. It doesn't tell you what your ex is feeling, because nothing honest can. It reads your answers against four cards and gives the thing you're carrying a name you can finally say, and then a way to set it down."
    ],
    "comparison": [
      {
        "criterion": "What happens at 2 a.m.",
        "without": "You argue with the thought alone",
        "with": "You ask Aura, and get an honest reply"
      },
      {
        "criterion": "Naming what you're holding",
        "without": "'I don't know, I just can't stop'",
        "with": "A written reading keyed to your answers"
      },
      {
        "criterion": "The next step after the reading",
        "without": "'Just move on'",
        "with": "A guided Cord Cutting Ritual, a symbolic release"
      },
      {
        "criterion": "When the thought comes back",
        "without": "Start from zero, again",
        "with": "Ask again, unlimited, with your history kept"
      },
      {
        "criterion": "Cost of one honest conversation",
        "without": "A psychic call by the minute",
        "with": "Less than $10 a month, cancel anytime"
      }
    ],
    "authority": "120,000+ readings delivered. Rated 4.9 by the people who read them. Every reading is written from your own answers and the cards drawn for you. The cards interpret; they never predict your ex or speak for them, and we won't pretend otherwise.",
    "value": [
      {
        "benefit": "Finally say what you're holding, in words that fit",
        "feature": "Your full 'Your Connection' reading, written from your answers and four cards"
      },
      {
        "benefit": "Set it down without deciding it never mattered",
        "feature": "The guided Cord Cutting Ritual, a symbolic release you can do tonight"
      },
      {
        "benefit": "Somewhere to go when the thought comes back at night",
        "feature": "Spiritual Guide 24/7, ask Aura again as many times as you need"
      },
      {
        "benefit": "See what changes between tonight and next month",
        "feature": "Unlimited readings with your history saved"
      },
      {
        "benefit": "Understand the dreams, and what came before",
        "feature": "New experiences included: Dreams, Past Lives, Rituals"
      }
    ],
    "priceLine": "$9.99 a month, $39.99 for 6 months, or $59.99 for a year. Less than one psychic call, and you can ask again every time the thought comes back.",
    "guarantee": "Read your full reading. Sit with it. If within 7 days it didn't give you anything real, email us and we refund you. No form, no questions about why.",
    "faq": [
      {
        "q": "Isn't this just generic stuff I could read for free?",
        "a": "Free cord-cutting content tells everyone the same thing and calls it energy. This reading is written from the seven answers you gave and the four cards drawn for you, and it names your pattern specifically. We also won't claim anything about your ex, because we can't know it. If it still reads generic to you, the 7-day guarantee exists for exactly that."
      },
      {
        "q": "Will it tell me if they're coming back?",
        "a": "No, and anything that says it can is guessing. The cards interpret your side: what you're holding, why, and what release could look like. That's the part you can actually do something with."
      },
      {
        "q": "Why a subscription and not one reading?",
        "a": "Because the thought doesn't come back once. The subscription is the 2 a.m. part: ask Aura again, re-read with your history, do the ritual when you're ready. Cancel whenever you want, including after the first week."
      },
      {
        "q": "Is this therapy?",
        "a": "No. It's a reflective, symbolic reading for entertainment and self-reflection, not medical or psychological care. If you're in crisis, please reach out to a professional or a local helpline. It can sit alongside therapy, as the private place for the thing you haven't said yet."
      }
    ],
    "ctaB": "Name what you're holding [Start my full reading] $9.99/month, cancel anytime, 7-day money-back guarantee"
  }
};
