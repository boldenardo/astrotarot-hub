// Funil de dor — segmento EX ("why can't I let him go").
// Copy gerada pelos agentes Ignite (01-icp → 03-validador → 06-hook-writer
// → 08-lp-copywriter) + revisão adversarial de claims (9 correções
// aplicadas: quantificadores de coorte removidos, cartas re-enquadradas
// como interpretação, mecanismo honesto na transição).
// Oferta: assinatura Unlimited ($9.99/mês · $39.99/6m · $59.99/ano) — o
// encaixe do ilimitado com a pergunta recorrente das 2h é o argumento.
// Claims notes do estrategista:
//   - No promise anywhere of reconciliation, his return, his feelings, or her 'getting over him' — all card copy uses interpretive framing only ('often speaks to', 'c
//   - Only proof used is the two permitted facts: '120,000+ readings delivered' and the 4.9 rating (authority block). Zero testimonials, zero segment statistics, zero
//   - Comparison table is fully qualitative — no percentages or invented data, per brief override of the 08 agent's default percentage instruction.
//   - No scarcity, no countdown, no fake urgency anywhere; urgency is purely emotional and real (the recurring 2 AM question).
//   - Guarantee stated exactly as briefed: real 7-day refund. Prices exactly as briefed: $9.99/mo anchor, $39.99/6mo, $59.99/yr, subscription framing with all 3 optio
//   - FAQ #1 proactively disclaims prediction of his return, converting the compliance limit into a trust signal.
//   - Quiz collects no free text — every answer is an enumerated option; reactions appear on exactly 3 key questions (q2, q4, q6).
//   - Cards chosen for thematic coherence with the ex/connection segment: 6 The Lovers (unmade choice), 10 Wheel of Fortune (returning cycles), 18 The Moon (night/sig
//   - 08-lp-copywriter format honored: 3 headline options were drafted per the agent (pain-led, identity-led, contra-intuitive-led) and the pain+objection version sel

import type { PainFunnelConfig } from "./types";

export const EX_CONFIG: PainFunnelConfig = {
  "segment": "ex",
  "pageTitle": "Why Can't I Let Him Go? | AstroTarot Egyptian Reading",
  "hook": {
    "line": "Still checking his stories at 2 AM — then hating yourself for it?",
    "sub": "7 questions. One card, chosen blind. The pattern that won't let you put him down — finally named.",
    "cta": "Start the 2-minute reading"
  },
  "quiz": [
    {
      "id": "q1",
      "stage": "recognition",
      "aura": [
        "Before we lay a single card, I need to ask you something. And I need you honest — not with me. With yourself.",
        "There's someone you haven't been able to put down, isn't there?"
      ],
      "question": "How long has he been living in your head?",
      "options": [
        {
          "id": "a",
          "label": "A few months. It should be over by now — it isn't.",
          "pattern": "unfinished-story"
        },
        {
          "id": "b",
          "label": "Over a year. I stopped telling people, because they don't get it.",
          "pattern": "echo-pattern"
        },
        {
          "id": "c",
          "label": "Years. He still shows up in dreams like no time has passed.",
          "pattern": "invisible-thread"
        },
        {
          "id": "d",
          "label": "It comes and goes. Right when I think I'm free, it pulls me back.",
          "pattern": "almost-door"
        }
      ]
    },
    {
      "id": "q2",
      "stage": "situation",
      "aura": [
        "Okay. Now the part nobody says out loud.",
        "It's 2 AM. You're not asleep. Tell me what that actually looks like."
      ],
      "question": "What does 2 AM look like for you?",
      "options": [
        {
          "id": "a",
          "label": "I check his stories. Then I hate that I checked.",
          "pattern": "almost-door"
        },
        {
          "id": "b",
          "label": "I look — but never leave a trace. He can't know I was there.",
          "pattern": "invisible-thread"
        },
        {
          "id": "c",
          "label": "I re-read our old messages, like there's a clue I missed.",
          "pattern": "unfinished-story"
        },
        {
          "id": "d",
          "label": "I check whether she — whoever she is — is in his photos now.",
          "pattern": "echo-pattern"
        }
      ],
      "reaction": "Listen to me. You're not 'stalking.' You're searching for an ending nobody ever gave you. Those are not the same thing — and the difference is exactly what your cards will speak to."
    },
    {
      "id": "q3",
      "stage": "thought",
      "aura": [
        "Now the question. The one that loops when your hands are busy and your mind isn't."
      ],
      "question": "Which thought keeps circling back?",
      "options": [
        {
          "id": "a",
          "label": "\"Does he think about me too?\"",
          "pattern": "invisible-thread"
        },
        {
          "id": "b",
          "label": "\"What did I do wrong?\"",
          "pattern": "unfinished-story"
        },
        {
          "id": "c",
          "label": "\"Was he the one — and I let him go?\"",
          "pattern": "echo-pattern"
        },
        {
          "id": "d",
          "label": "\"Why can't I just move on like a normal person?\"",
          "pattern": "almost-door"
        }
      ]
    },
    {
      "id": "q4",
      "stage": "behavior",
      "aura": [
        "Be honest with me on this next one. No one will ever see your answer but us."
      ],
      "question": "How many times have you almost texted him?",
      "options": [
        {
          "id": "a",
          "label": "I've typed it out. Deleted it. More than once this month.",
          "pattern": "almost-door"
        },
        {
          "id": "b",
          "label": "I actually sent it. I still replay how that went.",
          "pattern": "unfinished-story"
        },
        {
          "id": "c",
          "label": "I write him messages I never send — in my notes app.",
          "pattern": "echo-pattern"
        },
        {
          "id": "d",
          "label": "I don't text. I wait. Part of me still expects his name to light up my phone.",
          "pattern": "invisible-thread"
        }
      ],
      "reaction": "That message you keep deleting? It was never really for him. It's your own heart demanding an answer it never got. Hold onto that — it decides which card finds you."
    },
    {
      "id": "q5",
      "stage": "signs",
      "aura": [
        "This next one is where it's easiest to look away. Don't.",
        "The signs. The ones you don't mention because people would roll their eyes."
      ],
      "question": "What keeps 'finding' you?",
      "options": [
        {
          "id": "a",
          "label": "His song. Always at the worst possible moment.",
          "pattern": "echo-pattern"
        },
        {
          "id": "b",
          "label": "His name, his number, his birthday — everywhere I look.",
          "pattern": "invisible-thread"
        },
        {
          "id": "c",
          "label": "Dreams so real I wake up feeling like we actually talked.",
          "pattern": "invisible-thread"
        },
        {
          "id": "d",
          "label": "I think about him — and minutes later he views my story. Explain that.",
          "pattern": "almost-door"
        }
      ]
    },
    {
      "id": "q6",
      "stage": "fear",
      "aura": [
        "We're close now. So here is the question underneath every other question you've been asking yourself."
      ],
      "question": "What's the fear you never say out loud?",
      "options": [
        {
          "id": "a",
          "label": "That he's already forgotten me — while I'm still here.",
          "pattern": "invisible-thread"
        },
        {
          "id": "b",
          "label": "That I'll never feel that with anyone again.",
          "pattern": "echo-pattern"
        },
        {
          "id": "c",
          "label": "That I'll finally let go at exactly the wrong moment.",
          "pattern": "almost-door"
        },
        {
          "id": "d",
          "label": "That I'll carry this, quietly, for the rest of my life.",
          "pattern": "unfinished-story"
        }
      ],
      "reaction": "Thank you for not dressing that up. That's not an easy thing to put into words. That fear — the real one — is exactly where your reading needs to look. One more question."
    },
    {
      "id": "q7",
      "stage": "identity",
      "aura": [
        "Last one. And this one isn't about him at all. It's about you."
      ],
      "question": "Deep down, which of these is true about you?",
      "options": [
        {
          "id": "a",
          "label": "I love hard. I've never known how to love halfway.",
          "pattern": "echo-pattern"
        },
        {
          "id": "b",
          "label": "I don't get closure. I get silence — and I'm left to fill it alone.",
          "pattern": "unfinished-story"
        },
        {
          "id": "c",
          "label": "I feel things other people don't. Connections don't just die for me.",
          "pattern": "invisible-thread"
        },
        {
          "id": "d",
          "label": "I stand at doors I can't open and can't close.",
          "pattern": "almost-door"
        }
      ]
    }
  ],
  "transition": [
    "I'm not going to tell you to 'just move on.' You've heard that enough — and it never worked, because nobody ever named what this connection actually is. You can't release something that has no name.",
    "The Egyptian Tarot doesn't predict him. It reads the pattern — the invisible structure your answers just traced, the one that keeps pulling your mind back to him at 2 AM.",
    "I've laid four cards for you, face down. Your answers have already traced the pattern — the card you choose is the voice it will speak through. Don't overthink it. Choose with your gut."
  ],
  "patterns": [
    {
      "id": "unfinished-story",
      "label": "The Unfinished Story",
      "description": "A connection that ended without concluding. Her mind treats it as an open file — replaying conversations, re-reading messages, searching for the ending she was never given."
    },
    {
      "id": "invisible-thread",
      "label": "The Invisible Thread",
      "description": "She experiences the bond as still alive — dreams, signs, synchronicities, the persistent sense that he feels it too. The question 'does he think about me?' lives here."
    },
    {
      "id": "almost-door",
      "label": "The Almost-Door",
      "description": "She lives at the threshold: typing and deleting, checking and regretting, unable to fully close the door or walk back through it. The pattern of the hovering thumb."
    },
    {
      "id": "echo-pattern",
      "label": "The Echo",
      "description": "He became the template. Every new person is measured against him and loses; every strong feeling echoes back to that one connection. Loving hard turned into loving backward."
    }
  ],
  "cards": [
    {
      "number": 6,
      "name": "The Lovers",
      "interpretation": "The Lovers is the card of the crossroads bond — a connection that demanded a choice before you were ready to make one. When it appears for a tie that ended, it often speaks to something left unchosen between two people. And unchosen things rarely close on their own. They tend to wait — and keep asking.",
      "patternLine": "Drawn against your answers, this card points directly at {pattern} — the shape your mind has been circling without ever having a name for it."
    },
    {
      "number": 10,
      "name": "The Wheel of Fortune",
      "interpretation": "The Wheel is the card of cycles that return. For a connection like this one, it often marks a tie that isn't moving in a straight line — it's turning, bringing the same songs, the same dreams, the same almost-sent messages back around. A wheel doesn't stop just because you're tired of it. Seeing what's been driving it is where the turning can begin to change.",
      "patternLine": "Your answers place {pattern} at the very center of that wheel — the axis everything else keeps turning around."
    },
    {
      "number": 18,
      "name": "The Moon",
      "interpretation": "The Moon rules the hours when everyone else is asleep and you are not. It's the card of what surfaces in the dark — dreams that feel like visits, signs you can't explain to anyone without watching their face change. When it appears here, it often marks a bond still active beneath your daylight life, in the place logic can't reach.",
      "patternLine": "In your spread, this card illuminates {pattern} — and why it always gets louder after midnight."
    },
    {
      "number": 20,
      "name": "Judgement",
      "interpretation": "Judgement is the card of what refuses to stay buried. It can speak to a connection you've tried to lay to rest more than once — and each time, something calls it back to the surface. This card doesn't say what happens next. It says something in this story is still unanswered, and it's asking to be heard, not silenced.",
      "patternLine": "It names {pattern} as the part of you still waiting for a verdict that never came."
    }
  ],
  "openLoop": {
    "surfaceLine": "What you just read is the surface — the part of your pattern that shows. Your full written reading goes two layers beneath it.",
    "card2": "The Root: where this pattern actually began. Because it didn't start with him — and that is exactly why it didn't end with him.",
    "card3": "The Hold: what this connection is still feeding in you — the precise thing that makes your thumb hover over his name at 2 AM, and what your cards say it's asking for.",
    "cta": "Reveal the two hidden layers"
  },
  "lp": {
    "headline": "Finally Put Words to What He Still Is to You — Tonight — With a Personalized Egyptian Tarot Reading, Even if You've Tried Everything to 'Just Move On'",
    "subheadline": "Your full written reading is ready in minutes. And you can ask again — at 2 AM, after the dream, before you hit send — as many times as it takes.",
    "connection": [
      "You're not obsessed, and you're not broken. Some connections leave a pattern in you — and a pattern with no name doesn't dissolve. It repeats. That isn't a character flaw. That's how unfinished things behave.",
      "Everyone around you got the edited version. They don't know about the stories you check and instantly regret, the drafts you delete, the song that can wreck an entire day. Imagine being the woman who finally understands the thing she could never explain — instead of the one still performing 'I'm over it.'",
      "You've tried blocking him. Staying busy. Even someone new, who never stood a chance against the comparison. None of it worked, because none of it ever touched the pattern underneath. Your reading starts exactly there."
    ],
    "comparison": [
      {
        "criterion": "The 2 AM spiral",
        "without": "Checking his stories, then lying awake hating that you did",
        "with": "Opening a reading instead — words for what's actually pulling at you"
      },
      {
        "criterion": "The almost-sent message",
        "without": "Typed, deleted, retyped — decided by panic at midnight",
        "with": "Brought to your cards as a question first, so you act with clarity"
      },
      {
        "criterion": "The signs",
        "without": "His song plays and hijacks your whole day, unexplained",
        "with": "Interpreted inside your pattern — instead of left loose to haunt you"
      },
      {
        "criterion": "Understanding the connection",
        "without": "A thousand replayed memories, zero clarity",
        "with": "A named pattern you can finally look at directly"
      },
      {
        "criterion": "The question that keeps returning",
        "without": "Carried alone, on repeat, for months",
        "with": "Asked again every single time it returns — unlimited"
      }
    ],
    "authority": "AstroTarot has delivered over 120,000 personalized written readings, rated 4.9 by the people who received them. Every reading is written from your answers — your Egyptian Tarot spread is interpreted around your pattern and your question, never copied from a generic card meaning.",
    "value": [
      {
        "benefit": "Ask about him at 2 AM, at lunch, after the dream — without rationing a single question",
        "feature": "Unlimited personalized readings"
      },
      {
        "benefit": "Get guidance the moment the question hits, not days later when it's already eaten you alive",
        "feature": "Spiritual Guide, available 24/7"
      },
      {
        "benefit": "Track your own pattern over the weeks — in your own words, on the record",
        "feature": "Permanent reading history"
      },
      {
        "benefit": "Every spread speaks to your situation, your connection, your exact question",
        "feature": "Readings written from your answers, never generic"
      },
      {
        "benefit": "Walk away whenever you choose and keep everything you've learned",
        "feature": "Cancel anytime, in two taps"
      }
    ],
    "priceLine": "Unlimited Readings — $9.99/month. Or $39.99 for 6 months, or $59.99 for a full year. Less than a single traditional reading — for every question this connection will ever raise.",
    "guarantee": "Try it for 7 full days. If your readings don't give you words for this connection that nothing else has, email us and we refund you — no questions, no convincing, no guilt. You risk seven nights and ten dollars. You've already lost more sleep than that this week.",
    "faq": [
      {
        "q": "Will this tell me if he's coming back?",
        "a": "No — and you should be suspicious of anything that promises that. Your readings interpret the connection and the pattern holding you inside it. What you do with that clarity is entirely yours."
      },
      {
        "q": "How much time does this take?",
        "a": "A reading takes minutes to receive and read. You can open one exactly when the question hits — that's the whole point of unlimited."
      },
      {
        "q": "I've never used tarot. Do I need to know anything?",
        "a": "Nothing. You answer questions about your situation, choose your cards, and receive a written reading in plain English. No experience, no rituals, no jargon."
      },
      {
        "q": "Why is unlimited access cheaper than one session with a reader?",
        "a": "Because your readings are personalized and delivered digitally — no appointments, no hourly rate. You pay for access, not per question. And this particular question never comes just once."
      }
    ],
    "ctaB": "The question isn't going anywhere tonight — but tonight, it can finally start getting answers. [START MY UNLIMITED READINGS — $9.99/MO] 7-day money-back guarantee. Cancel anytime."
  }
};
