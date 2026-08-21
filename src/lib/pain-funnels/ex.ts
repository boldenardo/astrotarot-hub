// Funil de dor — segmento EX, ângulo "see what your ex says about you".
// A leitura lê A CONEXÃO DO LADO DELE (linguagem interpretativa das cartas,
// nunca fato sobre ele — a transição declara isso com todas as letras).
// Copy: agentes Ignite + revisão adversarial (16 correções aplicadas:
// fatos sobre o ex reformulados em moldura de carta, quantificadores
// removidos, "her" universal removido, rastreio temporal dele removido).
// Oferta: assinatura Unlimited ($9.99/mês · $39.99/6m · $59.99/ano).
//   - Proof claims used are exactly and only the two permitted: '120,000+ readings delivered' and the 4.9 rating. Zero testimonials, zero segment statistics
//   - Every statement about the ex uses interpretive language ('the cards suggest', 'often marks', 'can speak to', 'tends to read as'). No sentence asserts 
//   - No reconciliation promises: FAQ 2 explicitly refuses 'he will come back' and warns against anyone who promises it. No 'he still loves you' as fact any
//   - The 'how could you know' objection is confronted head-on in FAQ 1 with the honest mechanism: two-sided bond, interpretation not surveillance, recognit
//   - Open loop refers to hidden LAYERS of the one complete reading ('His Unspoken Testimony', 'The Version He Protects'), never a literal second or third c
//   - Comparison table contains no percentages. Guarantee is the real 7-day policy. No scarcity, no countdown, no fake urgency — ctaB urgency derives only f
//   - Price line lists all three real cycles ($9.99/mo, $39.99/6mo, $59.99/yr); '$1.16 a week' is arithmetic on the real annual price ($59.99/52).
//   - All quiz options are enumerated (no free text) and pass the 'how do they know I do this' test: each names a concrete private behavior (rereading a vag

import type { PainFunnelConfig } from "./types";

export const EX_CONFIG: PainFunnelConfig = {
  "segment": "ex",
  "pageTitle": "See What Your Ex Says About You — AstroTarot",
  "hook": {
    "line": "You weren't in the room. But were you the conversation?",
    "sub": "What does your ex say about you when you're not there? An Egyptian tarot reading of the connection — from HIS side of the story. We don't spy. We read.",
    "cta": "Reveal my place in his story"
  },
  "quiz": [
    {
      "id": "q1",
      "stage": "recognition",
      "aura": [
        "I'm going to ask you the kind of thing you only admit to yourself at 2am.",
        "No one else sees your answers. So be honest with me."
      ],
      "question": "When his name comes up — a song, a street, a mutual friend — where does your mind go first?",
      "options": [
        {
          "id": "q1a",
          "label": "To what he tells people about why we ended",
          "pattern": "rewritten_story"
        },
        {
          "id": "q1b",
          "label": "To whether he talks about me at all — or if I just... vanished",
          "pattern": "avoided_name"
        },
        {
          "id": "q1c",
          "label": "To how he describes me to whoever came after me",
          "pattern": "quiet_comparison"
        },
        {
          "id": "q1d",
          "label": "To whether he replays us the way I still do",
          "pattern": "unfinished_chapter"
        }
      ],
      "reaction": "Notice something: you didn't have to think. That question has been living in you for a while, hasn't it."
    },
    {
      "id": "q2",
      "stage": "situation",
      "aura": [
        "The mind doesn't circle without material. Life keeps handing you moments you can't stop reading."
      ],
      "question": "Which of these has actually happened to you?",
      "options": [
        {
          "id": "q2a",
          "label": "A mutual friend went quiet mid-sentence — like they knew something I don't",
          "pattern": "avoided_name"
        },
        {
          "id": "q2b",
          "label": "He posted something vague and I read it fourteen times",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "q2c",
          "label": "I heard a version of our breakup that was NOT what happened",
          "pattern": "rewritten_story"
        },
        {
          "id": "q2d",
          "label": "He watches my stories. Says nothing. Every single time.",
          "pattern": "quiet_comparison"
        }
      ]
    },
    {
      "id": "q3",
      "stage": "thought",
      "aura": [
        "Now the part nobody sees — what happens inside your head when the door is closed."
      ],
      "question": "Which conversation do you catch yourself rehearsing?",
      "options": [
        {
          "id": "q3a",
          "label": "Defending myself against a version of me I've never even been allowed to hear",
          "pattern": "rewritten_story"
        },
        {
          "id": "q3b",
          "label": "The exact speech I'd give if he ever asked to talk",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "q3c",
          "label": "Asking him, just once: 'what am I to you now?'",
          "pattern": "avoided_name"
        },
        {
          "id": "q3d",
          "label": "Imagining how he explains me to her",
          "pattern": "quiet_comparison"
        }
      ],
      "reaction": "You rehearse your defense for a trial you're never allowed to attend. Do you feel how heavy that is?"
    },
    {
      "id": "q4",
      "stage": "behavior",
      "aura": [
        "Let's turn and look at him for a moment. Men leave a trail — even in silence."
      ],
      "question": "What has his pattern been since the breakup?",
      "options": [
        {
          "id": "q4a",
          "label": "Total silence — like I never existed",
          "pattern": "avoided_name"
        },
        {
          "id": "q4b",
          "label": "Indirect posts, songs, quotes... never my name",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "q4c",
          "label": "He's told people HIS version — I keep hearing echoes of it",
          "pattern": "rewritten_story"
        },
        {
          "id": "q4d",
          "label": "He moved on fast. Too fast. Almost like a performance.",
          "pattern": "quiet_comparison"
        }
      ]
    },
    {
      "id": "q5",
      "stage": "fear",
      "aura": [
        "This next one costs something to answer.",
        "Take a breath. Then tell me the truth."
      ],
      "question": "Which would actually hurt more?",
      "options": [
        {
          "id": "q5a",
          "label": "Being the crazy one in his story — the villain he warns people about",
          "pattern": "rewritten_story"
        },
        {
          "id": "q5b",
          "label": "Not being in his story at all. Erased. Never mentioned.",
          "pattern": "avoided_name"
        },
        {
          "id": "q5c",
          "label": "Being the 'almost' he quietly measures her against — and never admits",
          "pattern": "quiet_comparison"
        },
        {
          "id": "q5d",
          "label": "Being the chapter he can't finish but refuses to reread",
          "pattern": "unfinished_chapter"
        }
      ],
      "reaction": "You knew your answer instantly. That's not a preference — that's the wound. And that's what we're reading tonight."
    },
    {
      "id": "q6",
      "stage": "longing",
      "aura": [
        "Imagine the veil lifted for sixty seconds. You could hear one thing from his side. Only one."
      ],
      "question": "What would you give almost anything to hear?",
      "options": [
        {
          "id": "q6a",
          "label": "The exact words he uses when someone asks about me",
          "pattern": "rewritten_story"
        },
        {
          "id": "q6b",
          "label": "What he admits to himself at 2am about what he lost",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "q6c",
          "label": "Whether my name still costs him something to say",
          "pattern": "avoided_name"
        },
        {
          "id": "q6d",
          "label": "What he compares her to when no one is watching",
          "pattern": "quiet_comparison"
        }
      ]
    },
    {
      "id": "q7",
      "stage": "identity",
      "aura": [
        "Last one. This one isn't about him. It's about the woman who has been carrying all of this."
      ],
      "question": "Who have you been in this waiting?",
      "options": [
        {
          "id": "q7a",
          "label": "The strong one — I perform 'over it' beautifully",
          "pattern": "quiet_comparison"
        },
        {
          "id": "q7b",
          "label": "The detective — I read every sign twice",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "q7c",
          "label": "The silenced one — my side of the story never got told",
          "pattern": "rewritten_story"
        },
        {
          "id": "q7d",
          "label": "The ghost — present in his life only as an absence",
          "pattern": "avoided_name"
        }
      ]
    }
  ],
  "transition": [
    "Here's what just happened: your seven answers drew a shape. Not his shape — yours. The exact way you live inside the story he carries. I've seen this shape before, and it has a name.",
    "Now let me be straight with you, because I don't do tricks. I cannot read his messages, and I won't pretend to. But the Egyptian tarot doesn't deal in surveillance — it reads the connection. And a connection always has two sides. The cards can speak to his.",
    "Four cards. Face down. One of them holds the mirror of his side — how you live in the story he tells, and the one he doesn't. Don't think. Your hand already knows which one."
  ],
  "patterns": [
    {
      "id": "unfinished_chapter",
      "label": "The Unfinished Chapter",
      "description": "The cards read your place in his story as the chapter never closed. The cards often mark this pattern as a bond a person circles back to in private — precisely because they never wrote its ending."
    },
    {
      "id": "rewritten_story",
      "label": "The Story He Rewrote",
      "description": "The cards read your place in his story as a character who was edited — a version retold until it protected the teller. The cards tend to read this pattern as guilt wearing the costume of blame."
    },
    {
      "id": "avoided_name",
      "label": "The Name He Avoids",
      "description": "The cards read your place in his story as a silence — the name that doesn't get said. The cards rarely read that kind of silence as absence. They usually read it as weight."
    },
    {
      "id": "quiet_comparison",
      "label": "The Quiet Comparison",
      "description": "The cards read your place in his story as the measuring stick — the standard held up, quietly, against whatever came after. The cards read this pattern in everything he never says out loud."
    }
  ],
  "cards": [
    {
      "number": 2,
      "name": "The Veiled Priestess",
      "interpretation": "When this arcanum answers a question about him, it often marks a silence that protects a feeling — not the absence of one. The cards suggest that what he doesn't say about you may be the loudest thing in any room he enters.",
      "patternLine": "Held against your seven answers, she names it: you are {pattern} — and this card speaks to why that part of the story stays behind the veil."
    },
    {
      "number": 6,
      "name": "The Two Paths",
      "interpretation": "This arcanum often marks a choice retold as certainty — someone who narrates his decision confidently in daylight, and re-walks the road not taken at night. The cards suggest the version he performs and the version he carries are not the same story.",
      "patternLine": "Crossed with your answers, the paths reveal it: you are {pattern} — and this card reads the gap between the story he tells and the one he walks back through."
    },
    {
      "number": 9,
      "name": "The Veiled Lamp",
      "interpretation": "The hermit's lamp is carried alone, shown to no one. When it answers a question about him, the cards can speak to what gets reviewed in private — the scene he returns to when there is no audience left to perform for.",
      "patternLine": "By this lamp's light, your answers take their true shape: you are {pattern} — and this card reads what that means on the side of the story you've never been shown."
    },
    {
      "number": 18,
      "name": "The Twilight",
      "interpretation": "This arcanum rules the half-light — where stories change shape in the retelling and a face looks different depending on who's describing it. The cards suggest the version of you moving through his world is a reflection, not a portrait. Reflections say more about the water than the moon.",
      "patternLine": "Under this twilight, your answers align: you are {pattern} — and this card reads how that version of you was made, and what it protects him from."
    }
  ],
  "openLoop": {
    "surfaceLine": "What you just read is the doorway of your reading — the surface layer. The Egyptian spread reads a bond in layers, and the deeper ones are still face down.",
    "card2": "Beneath the surface sits the layer I call His Unspoken Testimony — what the cards suggest he would never admit out loud about you. Not to his friends. Not to anyone else. Maybe not even to himself.",
    "card3": "And under that, the deepest layer: The Version He Protects — the reading's interpretation of the role you actually hold in the story he tells... and in the one he hides — which the cards rarely read as the same story.",
    "cta": "Unlock my full reading"
  },
  "lp": {
    "headline": "Stop Guessing What He Says About You. Read His Side of the Connection Instead.",
    "subheadline": "A personalized, written Egyptian tarot reading of how you live in the story he carries — and because this question comes back every week, your readings are unlimited.",
    "connection": [
      "Let's kill the ugly word first: you are not obsessed. You are unheard. If a version of you is being told out there — at dinners, in group chats, in his own head — you've never once been in the room for it. Wondering about it isn't crazy. It's human.",
      "Think about who may have gotten a version of the story: his friends, his family, maybe her. You're the only person involved who was never told how it goes — what name you carry in it, whether you're the villain, the regret, or worse: not in it at all.",
      "So you've done what anyone would do. Decoded the vague post. Read the silence twice. Fished, gently, with the mutual friend who suddenly changed the subject. And every clue just opened three more questions — because clues aren't a reading. They're bait."
    ],
    "comparison": [
      {
        "criterion": "The 2am spiral about what he says",
        "without": "You replay clues alone until you exhaust yourself",
        "with": "A written reading of his side you can return to, as many times as you need"
      },
      {
        "criterion": "His silence",
        "without": "Reads as rejection one night, erasure the next",
        "with": "Interpreted as a pattern with a name — and a meaning"
      },
      {
        "criterion": "Mutual friends who seem to know something",
        "without": "Careful fishing, half-answers, quiet humiliation",
        "with": "You stop needing scraps from people who might be protecting him"
      },
      {
        "criterion": "That vague post he made",
        "without": "Read fourteen times, still no answer",
        "with": "Placed inside your pattern, where it finally makes sense"
      },
      {
        "criterion": "Next week, when the question returns",
        "without": "The whole spiral starts over from zero",
        "with": "You ask again. Unlimited means unlimited."
      }
    ],
    "authority": "AstroTarot has delivered over 120,000 personalized written readings, rated 4.9 by the people who received them. Every reading is interpretive and honest about what it is: we read the connection between two people — never his phone, never his messages, never 'facts' about him. Your reading is written from your answers, your pattern, and your question. Nothing recycled, nothing generic.",
    "value": [
      {
        "benefit": "Ask about him every single time the question comes back",
        "feature": "Unlimited personalized written readings — no credits, no counting"
      },
      {
        "benefit": "Answers shaped by YOUR seven answers, not horoscope filler",
        "feature": "Every reading written against your named pattern"
      },
      {
        "benefit": "Someone to hold the 2am spiral with you",
        "feature": "Spiritual Guide available 24/7"
      },
      {
        "benefit": "Watch how the readings of his side of the bond shift over the weeks",
        "feature": "Complete reading history saved to your account"
      },
      {
        "benefit": "Walk away whole if it isn't for you",
        "feature": "7-day money-back guarantee, no questions asked"
      }
    ],
    "priceLine": "Unlimited access: $9.99/month — or $39.99 for 6 months — or $59.99 for a full year (less than $1.16 a week).",
    "guarantee": "Read your full reading. Sit with it for a week. If you don't recognize something true in it — something that lands — email us within 7 days and we refund every cent. No forms, no interrogation, no guilt. The risk of this decision is ours, not yours.",
    "faq": [
      {
        "q": "How could you possibly know what he says about me?",
        "a": "We can't — and anyone who claims they can is lying to you. We don't read his messages, we don't track his phone, and we don't know a single fact about him. Here's what we actually do: the Egyptian tarot reads the connection, and a connection has two sides. Your reading interprets his side of the bond — how you live in the story he carries — in the cards' own language: what an arcanum suggests, what a pattern often marks. We'll never tell you 'he said this.' We'll show you the shape of his side, and you'll recognize what's true the moment you read it. That recognition is the whole point."
      },
      {
        "q": "Will the reading tell me if he's coming back?",
        "a": "No — and please be suspicious of anyone who promises that. No card can guarantee another person's next move, and we won't pretend otherwise. What the reading gives you is something you've never had: an interpretation of his side of the story as it stands now. What you do with that clarity is yours."
      },
      {
        "q": "Is this actually personalized, or the same text everyone gets?",
        "a": "Your reading is written from your seven quiz answers, the pattern they revealed, and the card your own hand chose. Two women with different answers receive different readings — because they're living in different stories. Over 120,000 readings delivered, rated 4.9 by the people who received them."
      },
      {
        "q": "What if next week I'm spiraling about something new?",
        "a": "That's exactly why this is unlimited. This question doesn't get answered once — it comes back after every story view, every mutual-friend silence, every vague post. Ask again that night. Ask about something else entirely. Your subscription never counts, never meters, never makes you ration your own peace."
      }
    ],
    "ctaB": "His version of the story exists whether you've heard it or not — tonight you finally read it. [READ HIS SIDE NOW] Unlimited readings · from $9.99/mo · 7-day money-back guarantee"
  }
};
