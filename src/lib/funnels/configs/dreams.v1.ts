// Funil dreams — variante v1 (AstroTarot 2.0). Gerado pelos agentes Ignite
// (ICP → benchmark → validação 7.5/10 → SLO → buying agenda → hooks →
// 08-lp-copywriter) + revisão adversarial (9 correções aplicadas).
// Hook escolhido: You woke up thinking about the same person again. That dream may be about something completely different than you think.
// Oferta: assinatura Unlimited ($9.99/mês · $39.99/6m · $59.99/ano).

import type { PainFunnelConfig } from "@/lib/pain-funnels/types";

export const DREAMS_V1: PainFunnelConfig = {
  "segment": "dreams",
  "pageTitle": "What That Dream Keeps Circling Back To",
  "hook": {
    "line": "You woke up and the dream was still in the room. It may be about something completely different than you think.",
    "sub": "Six quick questions about the dream — then one card shows what it may keep circling back to.",
    "cta": "Read my dream"
  },
  "quiz": [
    {
      "id": "q1",
      "stage": "dream_type",
      "aura": [
        "Thank you for not cleaning it up. Now I need the shape of it.",
        "Just pick the closest one."
      ],
      "question": "What kind of dream was it?",
      "options": [
        {
          "id": "a",
          "label": "Someone from my past showed up. I thought I was done with them.",
          "pattern": "unfinished_conversation"
        },
        {
          "id": "b",
          "label": "I was being chased, or running from something I couldn't see.",
          "pattern": "unnamed_pressure"
        },
        {
          "id": "c",
          "label": "A place I couldn't leave. Doors, hallways, a house that wasn't right.",
          "pattern": "door_checked"
        },
        {
          "id": "d",
          "label": "Falling, losing control, teeth coming loose.",
          "pattern": "unnamed_pressure"
        },
        {
          "id": "e",
          "label": "Water. Drowning, waves, a storm.",
          "pattern": "self_outgrown"
        }
      ],
      "reaction": "Okay. That kind of dream rarely comes on a random night. It tends to show up when something awake has gone quiet — not finished. Quiet."
    },
    {
      "id": "q2",
      "stage": "waking_feeling",
      "aura": [
        "Now the part a dream dictionary never asks."
      ],
      "question": "When you opened your eyes — what was the first feeling in your body?",
      "options": [
        {
          "id": "a",
          "label": "Relief. Then a strange sadness that it was over.",
          "pattern": "unfinished_conversation"
        },
        {
          "id": "b",
          "label": "Heaviness. Like I'd carried something all night.",
          "pattern": "unnamed_pressure"
        },
        {
          "id": "c",
          "label": "Longing. I wanted to go back in.",
          "pattern": "door_checked"
        },
        {
          "id": "d",
          "label": "Dread. I checked my phone before I was even awake.",
          "pattern": "unnamed_pressure"
        },
        {
          "id": "e",
          "label": "Confusion. I couldn't tell what was me and what was the dream.",
          "pattern": "self_outgrown"
        }
      ],
      "reaction": "That feeling is the part that usually gets skipped. In a reading, the feeling on waking usually says more than the images — the images are the costume, the feeling is the message."
    },
    {
      "id": "q3",
      "stage": "recurrence",
      "aura": [
        "Be honest with me here, because it changes what the cards are for."
      ],
      "question": "Has this dream come before?",
      "options": [
        {
          "id": "a",
          "label": "First time. That's what unsettled me.",
          "pattern": "self_outgrown"
        },
        {
          "id": "b",
          "label": "A few times. Different details, same feeling.",
          "pattern": "unfinished_conversation"
        },
        {
          "id": "c",
          "label": "For years. I've stopped telling people.",
          "pattern": "door_checked"
        },
        {
          "id": "d",
          "label": "Only when life gets loud.",
          "pattern": "unnamed_pressure"
        }
      ],
      "reaction": "Whatever you picked — a dream that's worth remembering at lunch is already doing something. Recurring or not, it returns to the places where something awake hasn't been answered yet."
    },
    {
      "id": "q4",
      "stage": "who_appeared",
      "aura": [
        "Now the question you probably googled at 2 a.m."
      ],
      "question": "Who was there?",
      "options": [
        {
          "id": "a",
          "label": "An ex, or an old love.",
          "pattern": "unfinished_conversation"
        },
        {
          "id": "b",
          "label": "Family — someone still here, or someone gone.",
          "pattern": "unfinished_conversation"
        },
        {
          "id": "c",
          "label": "A stranger who felt familiar.",
          "pattern": "self_outgrown"
        },
        {
          "id": "d",
          "label": "Me. Watching myself, or a younger me.",
          "pattern": "self_outgrown"
        },
        {
          "id": "e",
          "label": "No one I could see. Just a presence.",
          "pattern": "door_checked"
        }
      ],
      "reaction": "Here's the thing a dictionary gets wrong: in a dream, who appears is rarely the subject. They're the messenger. The subject is usually what you haven't said — to them, or to yourself."
    },
    {
      "id": "q5",
      "stage": "avoid_awake",
      "aura": [
        "This one's harder. You can skip it in your head, but don't skip it with me."
      ],
      "question": "While you're awake — what are you quietly avoiding right now?",
      "options": [
        {
          "id": "a",
          "label": "A conversation I keep rehearsing and never having.",
          "pattern": "unfinished_conversation"
        },
        {
          "id": "b",
          "label": "A decision I keep pushing to next month.",
          "pattern": "unnamed_pressure"
        },
        {
          "id": "c",
          "label": "A feeling I don't let myself sit in.",
          "pattern": "door_checked"
        },
        {
          "id": "d",
          "label": "A person. I know exactly who.",
          "pattern": "unfinished_conversation"
        },
        {
          "id": "e",
          "label": "Nothing I can name. That's the problem.",
          "pattern": "self_outgrown"
        }
      ],
      "reaction": "That answer and the dream are usually the same thing wearing two different faces. Not as fact — as a pattern the cards can hold up so you can look at it without flinching."
    },
    {
      "id": "q6",
      "stage": "message",
      "aura": [
        "Last one. Then I'll bring the cards.",
        "Dreams don't hand you a message. But if this one did —"
      ],
      "question": "If the dream were one sentence, which would it be?",
      "options": [
        {
          "id": "a",
          "label": "Stop.",
          "pattern": "unnamed_pressure"
        },
        {
          "id": "b",
          "label": "Go back.",
          "pattern": "unfinished_conversation"
        },
        {
          "id": "c",
          "label": "Let go.",
          "pattern": "door_checked"
        },
        {
          "id": "d",
          "label": "Look closer.",
          "pattern": "self_outgrown"
        },
        {
          "id": "e",
          "label": "I don't want to know.",
          "pattern": "door_checked"
        }
      ],
      "reaction": "Notice that you answered without thinking. Some part of you already knows the sentence. The cards aren't here to tell you what it means — they're here so you can finally read it in daylight."
    }
  ],
  "transition": [
    "Here's what your answers keep pointing to: the dream isn't really about who was in it. It's about the thing that only gets to speak when you're asleep.",
    "I use Egyptian tarot for this — not to predict anything, but as a lens. A card can hold a dream still long enough for you to see the shape underneath it.",
    "Four cards, face down. Don't think. Pick the one your hand goes to — that's the one that gets to speak for your dream."
  ],
  "patterns": [
    {
      "id": "unfinished_conversation",
      "label": "The Unfinished Conversation",
      "description": "The dream keeps bringing back a person because something was never said — by you, or to you. The replay isn't about them. It's about the sentence still waiting in your mouth."
    },
    {
      "id": "unnamed_pressure",
      "label": "The Pressure You Don't Name",
      "description": "Chased, falling, teeth coming loose — the dream takes the shape of pressure because you carry it all day without calling it anything. At night it finally gets a body."
    },
    {
      "id": "door_checked",
      "label": "The Door You Keep Checking",
      "description": "A place you couldn't leave, a feeling you don't let yourself enter. The dream returns to the same door because part of you keeps going back to see if it's still locked."
    },
    {
      "id": "self_outgrown",
      "label": "The Self You Outgrew",
      "description": "A stranger who felt familiar, water rising, a version of you watching you. The dream may be holding up a self that no longer fits — before you've admitted it out loud."
    }
  ],
  "cards": [
    {
      "number": 18,
      "name": "The Moon",
      "interpretation": "The Moon is the card of what surfaces only when the daylight self steps aside. In a dream reading it can speak to images that feel bigger than the life they come from — a face, a place, a feeling that doesn't match the night it came on.",
      "patternLine": "When it lands on {pattern}, it often marks a story that lives in the dark because it hasn't been allowed a daytime name."
    },
    {
      "number": 2,
      "name": "The High Priestess",
      "interpretation": "The High Priestess sits between what is known and what is only sensed. She can speak to a knowing you already have — the one you felt when you chose the dream's sentence before you'd finished reading the options.",
      "patternLine": "Drawn against {pattern}, she often marks something you've understood for a while and haven't yet let yourself say."
    },
    {
      "number": 12,
      "name": "The Hanged Man",
      "interpretation": "The Hanged Man is suspended, not trapped. In dreamwork it can speak to a life paused around one thing — a conversation, a choice, a feeling — while everything else keeps moving.",
      "patternLine": "Held up to {pattern}, it often marks the place where you've been waiting for the dream to end instead of waiting for yourself to move."
    },
    {
      "number": 9,
      "name": "The Hermit",
      "interpretation": "The Hermit carries a lamp into the dark alone. It can speak to a dream that came back for you specifically — not to frighten you, but because you are the only one who can walk into it.",
      "patternLine": "Next to {pattern}, it often marks the moment the dream stops being something that happens to you and becomes something you go and look at."
    }
  ],
  "preview": {
    "title": "Your Dream Reading — preview",
    "items": [
      {
        "label": "Main emotional theme",
        "text": "{pattern}. The dream isn't the problem. It's the only place this theme gets to speak without you interrupting it."
      },
      {
        "label": "Symbols that stand out",
        "text": "Who appeared, and how you felt when you woke. Put those two side by side: if they don't quite match, that gap is usually where the real subject of the dream sits. If they do match, the subject is what both are pointing at."
      },
      {
        "label": "What your mind may be processing",
        "text": "The thing you said you're avoiding awake and the sentence you gave the dream point the same direction. Not as fact — as a pattern. Your mind may be rehearsing at night what it won't rehearse by day."
      },
      {
        "label": "A reflection to sit with",
        "text": "If {pattern} had a face, whose face would it be? Hold that before you check your phone. If the answer came fast, notice that too."
      }
    ]
  },
  "openLoop": {
    "surfaceLine": "That's the surface of your dream — the part a card shows anyone who sits down. It's not the part you woke up asking about.",
    "card2": "Underneath it sits a layer the full reading opens: what the dream is protecting you from having to decide while awake — and why it chose that person, that place, that feeling to carry it.",
    "card3": "And beneath that, the part people actually come back for: what the dream is asking of you, and what to do with it if it returns — because dreams that get carried to lunch often do.",
    "cta": "Open the full Dream Reading"
  },
  "lp": {
    "headline": "Know what that dream keeps circling back to — before it comes back again",
    "subheadline": "A Dream Reading about your dream, not a dictionary entry. Plus a guide for the next 3 a.m.",
    "connection": [
      "You've already told yourself it was just a dream. And yet you're here, and it's still in your chest. A dream you carry to lunch is not nothing. It's the one part of you that refuses to be dismissed.",
      "Maybe you told someone and they laughed it off. Maybe a dictionary told you water means emotions, or a forum told you everyone dreams about their ex. None of that was about you — about your feeling on waking, your door, your sentence.",
      "The cards don't tell you what the dream means. They hold it still so you can read it. And if it comes back, you'll have somewhere to bring it that isn't a search bar."
    ],
    "comparison": [
      {
        "criterion": "What it's about",
        "without": "A symbol list that fits anyone",
        "with": "Your dream, your answers, your pattern"
      },
      {
        "criterion": "When it comes back",
        "without": "Google at 2 a.m., alone",
        "with": "A guide awake when you are"
      },
      {
        "criterion": "Recurrence",
        "without": "You forget it by the next time",
        "with": "History that shows when it repeats"
      },
      {
        "criterion": "The thing you avoid awake",
        "without": "Never named",
        "with": "Held up beside the dream so you can see both"
      },
      {
        "criterion": "Privacy",
        "without": "Asking a friend who laughs",
        "with": "A reading no one else sees"
      }
    ],
    "authority": "120,000+ readings delivered. Rated 4.9 by the people who read them. Every reading is written for the person who asked — that is the whole method.",
    "value": [
      {
        "benefit": "Finally read the dream in daylight",
        "feature": "Your full Dream Reading, built on your six answers and the card you drew"
      },
      {
        "benefit": "See what it's protecting, asking, and likely to do next",
        "feature": "A 3-card pull about this dream"
      },
      {
        "benefit": "Somewhere to take it at 3 a.m. that isn't a search bar",
        "feature": "Master Aura, your spiritual guide, available 24/7"
      },
      {
        "benefit": "Know for sure when it's a pattern, not a one-off",
        "feature": "Your reading history, kept in one place"
      },
      {
        "benefit": "Ask about anything else that keeps you up",
        "feature": "Unlimited readings, plus Rituals, Dreams and Past Lives experiences"
      }
    ],
    "priceLine": "Unlimited: $9.99/month, $39.99 for 6 months, or $59.99 for the year — less than a dream-dictionary book, and it answers the next dream too.",
    "guarantee": "7 days, no questions. If the reading doesn't give you one true thing about your dream, email us and we refund you. The risk is ours, not yours.",
    "faq": [
      {
        "q": "Is this telling me what my dream really means?",
        "a": "No. Nobody can, and anyone who says they can is selling you a dictionary. This is a reflection, not a diagnosis. The cards give your dream a shape and a language; you decide what rings true. If one line lands, that line is the reading."
      },
      {
        "q": "I came here about a dream. Why tarot?",
        "a": "The cards are the method, not the promise. Egyptian arcana are a set of images built to hold human situations — loss, waiting, fear, return. We use them as a lens to read your dream, the way you'd hold a photo up to the light."
      },
      {
        "q": "What if the dream doesn't come back?",
        "a": "Then you have a reading about the one that did, and a guide for whatever else keeps you up. Unlimited covers every reading you want — dreams, relationships, decisions — not just this one."
      },
      {
        "q": "Will anyone know?",
        "a": "No. Your readings are yours. Nothing is shared, nothing is posted, and you can cancel anytime from your account in two taps."
      }
    ],
    "ctaB": "Read the dream before it comes back [OPEN MY DREAM READING] 7-day guarantee. Cancel anytime."
  }
};
