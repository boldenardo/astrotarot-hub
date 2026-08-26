// Funil past-life — variante v1 (AstroTarot 2.0). Gerado pelos agentes Ignite
// (ICP → benchmark → validação 7.5/10 → SLO → buying agenda → hooks →
// 08-lp-copywriter) + revisão adversarial (4 correções aplicadas).
// Hook escolhido: You didn't meet this person. You recognized them.
// Oferta: assinatura Unlimited ($9.99/mês · $39.99/6m · $59.99/ano).

import type { PainFunnelConfig } from "@/lib/pain-funnels/types";

export const PASTLIFE_V1: PainFunnelConfig = {
  "segment": "pastlife",
  "pageTitle": "Past-Life Connection Reading",
  "hook": {
    "line": "You didn't meet this person. You recognized them.",
    "sub": "Seven short questions and four Egyptian cards can speak to why this one felt familiar before you knew their name.",
    "cta": "Why did this feel familiar?"
  },
  "quiz": [
    {
      "id": "q1",
      "stage": "familiarity",
      "aura": [
        "Hi. I'm the Master Aura. I'll keep this short.",
        "There's a person you keep thinking about tonight. I want to start with the first moment."
      ],
      "question": "The first time you were around them, what happened?",
      "options": [
        {
          "id": "a",
          "label": "I felt calm, like I'd been here before",
          "pattern": "keeper"
        },
        {
          "id": "b",
          "label": "I wanted to leave and couldn't",
          "pattern": "leftfirst"
        },
        {
          "id": "c",
          "label": "I noticed everything and said almost nothing",
          "pattern": "witness"
        },
        {
          "id": "d",
          "label": "I wanted to take care of them right away",
          "pattern": "healer"
        }
      ],
      "reaction": "That's the part people skip over. The first moment usually isn't about them. It may be your body recognizing a role it already knows how to play."
    },
    {
      "id": "q2",
      "stage": "lived-before",
      "aura": [
        "Now the thought you don't say out loud."
      ],
      "question": "Has the phrase \"we've done this before\" ever crossed your mind with them?",
      "options": [
        {
          "id": "a",
          "label": "Yes, and it scared me a little",
          "pattern": "leftfirst"
        },
        {
          "id": "b",
          "label": "Yes, and it felt like relief",
          "pattern": "keeper"
        },
        {
          "id": "c",
          "label": "Not in words. More like a feeling in my chest",
          "pattern": "witness"
        },
        {
          "id": "d",
          "label": "I tried to talk myself out of it",
          "pattern": "healer"
        }
      ],
      "reaction": "Whatever you answered, notice this: the feeling came before any reason did. The cards read that feeling as a symbol, not a fact. That's where we'll go."
    },
    {
      "id": "q3",
      "stage": "repeat",
      "aura": [
        "This is the question that's hard to answer honestly."
      ],
      "question": "Be honest. Have you felt this exact pull with someone else before?",
      "options": [
        {
          "id": "a",
          "label": "Yes. Same intensity, same ending",
          "pattern": "keeper"
        },
        {
          "id": "b",
          "label": "Yes, and I'm the one who ended it last time",
          "pattern": "leftfirst"
        },
        {
          "id": "c",
          "label": "Maybe once. I never let it get far",
          "pattern": "witness"
        },
        {
          "id": "d",
          "label": "Yes. I gave everything and it still ended",
          "pattern": "healer"
        }
      ],
      "reaction": "Thank you. That answer is the real reason you're here. Not them. The repeat."
    },
    {
      "id": "q4",
      "stage": "fear",
      "aura": [
        "Now the fear. Don't clean it up."
      ],
      "question": "When did the fear of losing them show up?",
      "options": [
        {
          "id": "a",
          "label": "Day one. Before anything had even happened",
          "pattern": "keeper"
        },
        {
          "id": "b",
          "label": "The moment they got close",
          "pattern": "leftfirst"
        },
        {
          "id": "c",
          "label": "It's quiet. It sits in the background every day",
          "pattern": "witness"
        },
        {
          "id": "d",
          "label": "When I noticed I was giving more than I got",
          "pattern": "healer"
        }
      ],
      "reaction": "Whenever it showed up, notice that it showed up before anything was actually lost. Fear like that tends to come from a pattern that already thinks it knows how this goes. We're going to name it."
    },
    {
      "id": "q5",
      "stage": "intensity",
      "aura": [
        "Almost there."
      ],
      "question": "What about this connection makes no sense to you?",
      "options": [
        {
          "id": "a",
          "label": "How sure I am, with so little to go on",
          "pattern": "keeper"
        },
        {
          "id": "b",
          "label": "How much I want them and how much I want to run",
          "pattern": "leftfirst"
        },
        {
          "id": "c",
          "label": "How much I see in them that nobody else does",
          "pattern": "witness"
        },
        {
          "id": "d",
          "label": "How much I'd give up for them",
          "pattern": "healer"
        }
      ],
      "reaction": "Whatever you picked, it's the same shape: the feeling is bigger than the story. That gap is exactly what a symbolic reading is for."
    },
    {
      "id": "q6",
      "stage": "who",
      "aura": [
        "One more about them. Then one about you."
      ],
      "question": "Who is this person in your life today?",
      "options": [
        {
          "id": "a",
          "label": "An ex",
          "pattern": "keeper"
        },
        {
          "id": "b",
          "label": "Someone I'm with now",
          "pattern": "witness"
        },
        {
          "id": "c",
          "label": "Someone new",
          "pattern": "leftfirst"
        },
        {
          "id": "d",
          "label": "It's complicated",
          "pattern": "healer"
        }
      ],
      "reaction": "Good. I won't tell you what they feel or what they'll do. I can't, and no card can. What I can show you is the role you walked in carrying."
    },
    {
      "id": "q7",
      "stage": "season",
      "aura": [
        "Last one. This only sets the texture of your reading."
      ],
      "question": "What season were you born in?",
      "options": [
        {
          "id": "a",
          "label": "Winter",
          "pattern": "none"
        },
        {
          "id": "b",
          "label": "Spring",
          "pattern": "none"
        },
        {
          "id": "c",
          "label": "Summer",
          "pattern": "none"
        },
        {
          "id": "d",
          "label": "Autumn",
          "pattern": "none"
        }
      ],
      "reaction": "Noted. Your season colors the atmosphere of the archetype, nothing more. Let me lay the cards."
    }
  ],
  "transition": [
    "I'm laying four Egyptian cards for this connection. Not for them. For the part of you that recognized them.",
    "Each card speaks to one piece: the recognition, the repeat, the fear, and what it may be asking of you now.",
    "Together they point to a symbolic archetype. It's not a history. It's a name for the role you keep walking into."
  ],
  "patterns": [
    {
      "id": "keeper",
      "label": "The Keeper of a Promise",
      "description": "A symbolic archetype for the one who stays past the point of sense. The bond feels older than the relationship, and leaving feels like breaking something sacred, even when staying costs too much."
    },
    {
      "id": "leftfirst",
      "label": "The One Who Left First",
      "description": "A symbolic archetype for the one who leaves before being left. Closeness and the urge to run arrive together, and the exit is always planned, even while the heart is saying stay."
    },
    {
      "id": "witness",
      "label": "The Witness",
      "description": "A symbolic archetype for the one who sees everything and says almost nothing. Deeply present, rarely fully in. The connection is felt more than spoken, and the edge feels safer than the center."
    },
    {
      "id": "healer",
      "label": "The Healer Who Couldn't Stay",
      "description": "A symbolic archetype for the one who gives until there's nothing left, then disappears. Love shows up as care, care turns into depletion, and the leaving looks sudden from the outside only."
    }
  ],
  "cards": [
    {
      "number": 6,
      "name": "The Two Roads",
      "interpretation": "This card often marks a crossing: two paths that look like one until you're standing on them. It can speak to a choice made before you noticed you were choosing.",
      "patternLine": "For {pattern}, The Two Roads often points to the moment the recognition happened, and the road your feet picked without asking you."
    },
    {
      "number": 14,
      "name": "The Two Urns",
      "interpretation": "Water poured from one vessel to another. This card can speak to exchange, to what flows between two people, and to what gets lost in the pouring.",
      "patternLine": "With {pattern}, The Two Urns tends to show where the repeat lives: the same flow, the same imbalance, a different face holding the other urn."
    },
    {
      "number": 18,
      "name": "Twilight",
      "interpretation": "The card of half-light. It often marks what is felt but not yet seen clearly, and the fear that grows in the space between knowing and proof.",
      "patternLine": "Twilight, beside {pattern}, can speak to the fear of losing them, and to an old ending your body may be bracing for even when your mind has no reason to."
    },
    {
      "number": 20,
      "name": "The Awakening",
      "interpretation": "A call that wakes what was sleeping. This card often speaks to something returning for a reason: a lesson not finished, a part of you asking to be seen.",
      "patternLine": "For {pattern}, The Awakening may mark what this connection is asking of you now. Not an outcome. A question you finally get to answer differently."
    }
  ],
  "preview": {
    "title": "Your Past-Life Archetype",
    "items": [
      {
        "label": "Era and atmosphere (symbolic)",
        "text": "Your cards set the scene as something quiet and older than the present: stone, water, a vow made at dusk. As a symbol, this atmosphere often reflects how seriously you take a bond once you feel it."
      },
      {
        "label": "Your role",
        "text": "{pattern}. A symbolic archetype for the role you tend to walk into when someone feels familiar too fast. This is about you, not about them."
      },
      {
        "label": "Central lesson",
        "text": "This archetype tends to carry one lesson: the feeling of recognition is real, but it is not proof of a future. The lesson is learning to stay present without handing the ending to a pattern."
      },
      {
        "label": "Pattern carried forward",
        "text": "The Two Urns and Twilight can speak to how {pattern} repeats: the same pull, the same early fear, the same role. Naming it is the first thing that interrupts it."
      },
      {
        "label": "What this may represent today",
        "text": "With the person you named, The Awakening may mark a chance to answer an old question differently. Not \"will they stay\" but \"what do I do when I recognize someone.\""
      }
    ]
  },
  "openLoop": {
    "surfaceLine": "You now have the name and the lesson. That's the surface.",
    "card2": "Underneath it is what The Awakening asks of you with this specific person, and why the fear showed up when it did.",
    "card3": "And beneath that, the part you came for: what the repeat may be preparing you for, and how to tell recognition from habit.",
    "cta": "Read the full connection"
  },
  "lp": {
    "headline": "Your archetype has a name. Now read what it's asking of you.",
    "subheadline": "The full written reading of this connection, plus unlimited readings and a Spiritual Guide you can talk to at 2am. Cancel anytime.",
    "connection": [
      "You didn't meet them. You recognized them. And you've been told that's \"too intense\" so many times you started saying it about yourself.",
      "The part you don't tell anyone: you've felt this before, with someone else, and it ended the same way. Tonight you're wondering if you're the one repeating it.",
      "Horoscope apps gave you traits. TikTok tarot gave you a verdict about them. Nobody gave you a frame for the pattern. That's what this reading is."
    ],
    "comparison": [
      {
        "criterion": "What you get about this connection",
        "without": "A vague sense it means something",
        "with": "A named symbolic archetype and its lesson"
      },
      {
        "criterion": "Focus of the reading",
        "without": "Guessing what they feel",
        "with": "The role you walk in carrying"
      },
      {
        "criterion": "The repeat",
        "without": "Noticed, unexplained",
        "with": "Named, with the pattern carried forward"
      },
      {
        "criterion": "When the next question hits at 2am",
        "without": "Texting them, or scrolling",
        "with": "Spiritual Guide 24/7"
      },
      {
        "criterion": "Over time",
        "without": "Each connection feels new and the same",
        "with": "A history you can actually reread"
      }
    ],
    "authority": "AstroTarot has delivered more than 40,000 written readings, with an average rating of 4.9. Every reading is written for your answers, not pulled from a list of traits. We read cards as symbols for reflection. We don't claim facts about past lives, and we never claim to know what another person feels or will do.",
    "value": [
      {
        "benefit": "A name for the pattern and what it asks of you now",
        "feature": "Full written Past-Life Connection reading: 4 Egyptian cards, archetype, lesson, pattern carried forward, what it may represent today"
      },
      {
        "benefit": "A place to bring the next question at 2am",
        "feature": "Spiritual Guide 24/7 (Master Aura)"
      },
      {
        "benefit": "See the pattern over time instead of re-living it",
        "feature": "Reading history, saved and rereadable"
      },
      {
        "benefit": "Keep going deeper when you're ready",
        "feature": "Unlimited readings plus Rituals, Dreams and Past Lives experiences"
      }
    ],
    "priceLine": "Unlimited: $9.99/month · $39.99 for 6 months · $59.99 for a year",
    "guarantee": "7-day guarantee. Read the full connection. If it doesn't give you something real to hold onto, email us within 7 days and we refund you. No questions, no forms.",
    "faq": [
      {
        "q": "Is this a real past life?",
        "a": "No. This is a symbolic reading for reflection. We don't claim facts about past lives, and the archetype is a name for a pattern, not a history. Many people find the symbol useful precisely because it's about them, not about proof."
      },
      {
        "q": "Will it tell me what this person feels or whether they'll come back?",
        "a": "No, and please be careful with anything that says it can. The cards speak to your role, your fear and your repeat. That's what you can actually work with."
      },
      {
        "q": "What happens after I subscribe?",
        "a": "Your full reading opens immediately. Then you can ask the Spiritual Guide anything, run unlimited readings, and revisit everything in your history. Cancel anytime from your account."
      },
      {
        "q": "Why so cheap?",
        "a": "Because the first reading is the start, not the product. Unlimited is less than one live psychic call, and it comes with a real 7-day refund window. If you later want a portrait, Draw My Soulmate is an optional next step. We'll mention it once and leave it there."
      }
    ],
    "ctaB": "Read the full connection [SHOW MY READING] 7-day guarantee · cancel anytime"
  }
};
