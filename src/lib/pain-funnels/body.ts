// Config da variante BODY — copy gerada pela execução dos
// agentes originais do Ignite System (01-ICP → 03-Validador → 06-Hook
// Writer → 08-LP Copywriter) e passada por revisão adversarial de claims.
// Score do Validador: 7.5 — AVANCA COM AJUSTES.
//
// Vendemos LEITURA, nunca desfecho: nada aqui promete resultado externo.
// Estrutura obrigatória do LP Copywriter validada por script no build
// deste arquivo (3 parágrafos, 5 critérios, 4 FAQs, 7 interações).

import type { PainFunnelConfig } from "./types";

export const BODY_CONFIG: PainFunnelConfig = {
  "segment": "body",
  "pageTitle": "The Cycle Behind Starting Over",
  "hook": {
    "line": "You've said \"Monday I start\" so many times it's basically a ritual now. That was never a discipline problem. It's a pattern — and your pattern has a name.",
    "sub": "Seven honest questions about the cycle you keep returning to — then one card names what keeps pulling you back.",
    "cta": "Show me my pattern"
  },
  "quiz": [
    {
      "id": "q1",
      "stage": "reconhecimento",
      "aura": [
        "Hi, I'm Aura. Before we touch a single card, I want to ask you something.",
        "Be honest with me — no one else sees this."
      ],
      "question": "How many times have you told yourself \"this time will be different\" — and truly meant it?",
      "options": [
        {
          "id": "q1a",
          "label": "Too many to count. And I meant it every single time.",
          "pattern": "restart_loop"
        },
        {
          "id": "q1b",
          "label": "A few. I usually last two or three weeks.",
          "pattern": "restart_loop"
        },
        {
          "id": "q1c",
          "label": "I've stopped saying it. Breaking one more promise to myself hurts too much.",
          "pattern": "mirror_critic"
        },
        {
          "id": "q1d",
          "label": "I still say it — but a part of me already knows how it ends.",
          "pattern": "quiet_rebel"
        }
      ],
      "reaction": "The fact that you meant it every time? That's the part nobody understands. This was never about willpower, honey."
    },
    {
      "id": "q2",
      "stage": "situacao",
      "aura": [
        "Let me paint a picture. Tell me if it sounds familiar.",
        "You're getting dressed to go somewhere. There's a mirror."
      ],
      "question": "What actually happens in front of that mirror?",
      "options": [
        {
          "id": "q2a",
          "label": "I try on three or four outfits and leave in the one that hides the most.",
          "pattern": "mirror_critic"
        },
        {
          "id": "q2b",
          "label": "I already know what \"works.\" I don't even try anything else anymore.",
          "pattern": "restart_loop"
        },
        {
          "id": "q2c",
          "label": "I avoid the mirror. I dress fast and don't look twice.",
          "pattern": "comfort_trade"
        },
        {
          "id": "q2d",
          "label": "Some days I'm fine. Then one photo ruins the whole week.",
          "pattern": "mirror_critic"
        }
      ]
    },
    {
      "id": "q3",
      "stage": "repeticao",
      "aura": [
        "Okay. Now the part people won't say out loud."
      ],
      "question": "Monday morning. New plan, new promise. What usually breaks it first?",
      "options": [
        {
          "id": "q3a",
          "label": "One bad day. Then the whole week feels ruined, so why bother.",
          "pattern": "restart_loop"
        },
        {
          "id": "q3b",
          "label": "It works... right up until it starts working. Then I quietly let it slip.",
          "pattern": "quiet_rebel"
        },
        {
          "id": "q3c",
          "label": "Stress. The plan is fine until life isn't.",
          "pattern": "comfort_trade"
        },
        {
          "id": "q3d",
          "label": "Honestly? I don't even know. It just fades.",
          "pattern": "restart_loop"
        }
      ]
    },
    {
      "id": "q4",
      "stage": "emocao",
      "aura": [
        "I want to ask about the evenings.",
        "That hour after everyone else's needs are met — and yours still aren't."
      ],
      "question": "When the day has been heavy, what do you reach for?",
      "options": [
        {
          "id": "q4a",
          "label": "Something to eat — not because I'm hungry. Because I'm empty.",
          "pattern": "comfort_trade"
        },
        {
          "id": "q4b",
          "label": "My phone. Scrolling other people's lives instead of feeling mine.",
          "pattern": "mirror_critic"
        },
        {
          "id": "q4c",
          "label": "Nothing. I just go quiet and shut down.",
          "pattern": "quiet_rebel"
        },
        {
          "id": "q4d",
          "label": "I keep myself busy so I don't have to sit with it.",
          "pattern": "restart_loop"
        }
      ],
      "reaction": "That hour belongs to everyone but you. And then you wonder why there's nothing left for your own promises. I see it, even if no one else does."
    },
    {
      "id": "q5",
      "stage": "frustracao",
      "aura": [
        "Here's something I've noticed after years of these conversations."
      ],
      "question": "You've tried before. What did all those attempts have in common?",
      "options": [
        {
          "id": "q5a",
          "label": "They all treated my body like the problem. None of them asked why I keep coming back here.",
          "pattern": "restart_loop"
        },
        {
          "id": "q5b",
          "label": "They worked for a while. I'm the thing that stopped working.",
          "pattern": "mirror_critic"
        },
        {
          "id": "q5c",
          "label": "They were built for a version of me with a quieter life than the real one.",
          "pattern": "comfort_trade"
        },
        {
          "id": "q5d",
          "label": "I honestly can't remember them all. That's the embarrassing part.",
          "pattern": "quiet_rebel"
        }
      ]
    },
    {
      "id": "q6",
      "stage": "frustracao",
      "aura": [
        "One more before the last question. This one stings a little."
      ],
      "question": "When you see a photo of yourself from a few years ago, what's the first thought?",
      "options": [
        {
          "id": "q6a",
          "label": "\"I thought I looked bad THEN.\" I'd give anything to feel like that again.",
          "pattern": "mirror_critic"
        },
        {
          "id": "q6b",
          "label": "I wonder where that woman's energy went.",
          "pattern": "restart_loop"
        },
        {
          "id": "q6c",
          "label": "I don't look at old photos. On purpose.",
          "pattern": "comfort_trade"
        },
        {
          "id": "q6d",
          "label": "That it all happened slowly — while I was busy taking care of everyone else.",
          "pattern": "quiet_rebel"
        }
      ]
    },
    {
      "id": "q7",
      "stage": "identidade",
      "aura": [
        "Last question. Then I'll ask you to choose a card.",
        "Answer with your gut, not your head."
      ],
      "question": "Deep down, who do you feel like you've become?",
      "options": [
        {
          "id": "q7a",
          "label": "Someone watching her own life from the passenger seat.",
          "pattern": "quiet_rebel"
        },
        {
          "id": "q7b",
          "label": "The \"before\" photo of a transformation that never comes.",
          "pattern": "mirror_critic"
        },
        {
          "id": "q7c",
          "label": "A woman who keeps everyone's promises except the ones she makes to herself.",
          "pattern": "restart_loop"
        },
        {
          "id": "q7d",
          "label": "Someone who's tired. Not lazy — tired. There's a difference.",
          "pattern": "comfort_trade"
        }
      ]
    }
  ],
  "transition": [
    "Thank you for being that honest with me. It's easy to click through these things without feeling anything. You didn't — and that tells me a lot.",
    "Here's what I can already see: this was never about your body, and it won't end there. Your answers trace a loop — one that resets at the same point, for a reason you haven't been shown yet.",
    "This is why I use the Egyptian deck. It's older than every plan you've ever tried, and it doesn't hand out rules — it names patterns. Pick one card. Don't overthink it. The card you're drawn to tends to name the very thing you've been circling."
  ],
  "patterns": [
    {
      "id": "restart_loop",
      "label": "The Restart Loop",
      "description": "Ela recomeca com forca total, abandona entre a 2a e 3a semana e conclui que faltou disciplina. O loop se alimenta da propria vergonha do recomeco anterior. Palavra-chave emocional: 'de novo'."
    },
    {
      "id": "mirror_critic",
      "label": "The Mirror Critic",
      "description": "A autoimagem e mediada por uma voz interna impiedosa: espelho, fotos, comparacao com outras mulheres e com a versao antiga dela mesma. Evita registro da propria imagem. Palavra-chave: 'nao me reconheco'."
    },
    {
      "id": "comfort_trade",
      "label": "The Comfort Trade",
      "description": "Troca emocao nao processada por conforto imediato no fim do dia (comida ligada a emocao, desligar, anestesiar) e paga com culpa na manha seguinte. Palavra-chave: 'vazia, nao com fome'."
    },
    {
      "id": "quiet_rebel",
      "label": "The Quiet Rebel",
      "description": "Sabota o proprio progresso justamente quando comeca a funcionar — como se uma parte dela nao confiasse no que vem depois da mudanca. Palavra-chave: 'eu solto quando esta dando certo'."
    }
  ],
  "cards": [
    {
      "number": 10,
      "name": "Wheel of Fortune",
      "interpretation": "This card can symbolize a cycle that turns on its own schedule — the sense of passing the same point again and again, no matter how differently each lap begins. Within your reading, it often shifts the question from \"how do I push harder?\" to \"what keeps the wheel turning?\"",
      "patternLine": "For a woman carrying {pattern}, the Wheel tends to mark the exact spot where the loop resets — which is where your full reading begins."
    },
    {
      "number": 18,
      "name": "The Moon",
      "interpretation": "This card can symbolize what moves beneath the surface — the feelings that steer the evening long after the day pretended to be fine. Within your reading, it often points to the gap between what you show the mirror and what the mirror never sees.",
      "patternLine": "When {pattern} is the dominant pattern, The Moon usually appears to name what that pattern has been hiding from you."
    },
    {
      "number": 12,
      "name": "The Hanged Man",
      "interpretation": "This card can symbolize a pause that looks like being stuck but feels more like a held breath — a life suspended between who you were and who you keep postponing. Within your reading, it often suggests that the way forward starts with seeing everything from a completely different angle, not with trying harder.",
      "patternLine": "In a spread shaped by {pattern}, The Hanged Man often marks the point where effort stopped working — and where seeing differently could."
    },
    {
      "number": 17,
      "name": "The Star",
      "interpretation": "This card can symbolize the quiet part of you that never fully gave up, even after every restart. Within your reading, it tends to appear as a direction rather than a promise — where your energy wants to flow when nothing is standing in its way.",
      "patternLine": "Set against {pattern}, The Star usually shows what remains intact underneath the loop — the thread your full reading follows."
    }
  ],
  "openLoop": {
    "surfaceLine": "That's the surface of your card — the free layer, the part I can read for anyone. Your answers deserve the rest of it.",
    "card2": "Your full reading goes where I can't go for free. The next layer names when this loop actually started — and you may recognize the exact chapter of your life the moment you see it.",
    "card3": "The deepest layer is the one I never give away for free: what the pattern has been protecting you from all this time. That one changes how you read every restart you've ever made.",
    "cta": "Unlock your full reading now — unlimited personal readings from $9.99 a month, the first in your hands within minutes."
  },
  "lp": {
    "headline": "Put a name to the pattern that keeps pulling you back to square one — in the next 10 minutes with the Pattern Mirror Method — even if you're sure you've already tried everything.",
    "subheadline": "Your first full reading arrives minutes after checkout — and it finally explains the loop, instead of blaming you for it.",
    "connection": [
      "Everyone told you it's a discipline problem. But you run a job, a home, and other people's entire lives — discipline was never the missing piece. What's missing is a name for the thing that keeps pulling you back.",
      "Picture walking into a room without scanning it to compare. Picture a photo you don't inspect before anyone else sees it. That is what a full reading is for: not a new body — a ceasefire. Quiet in front of the mirror, because the loop finally has a name.",
      "You've done the plans, the apps, the Monday restarts. Every one of them handed you rules for your body and silence about your loop. That's why they lasted three weeks — they never touched the part of you that keeps pressing restart."
    ],
    "comparison": [
      {
        "criterion": "What you know about the cycle",
        "without": "A vague, heavy feeling that you always end up back here",
        "with": "A named pattern, read card by card in plain language"
      },
      {
        "criterion": "Monday mornings",
        "without": "Another promise built on willpower alone",
        "with": "A starting point built on why you stop — not just what to do"
      },
      {
        "criterion": "The mirror moment",
        "without": "An opponent you check, judge, and avoid",
        "with": "Context for the voice that shows up there — and where it learned its lines"
      },
      {
        "criterion": "Your 2 a.m. questions",
        "without": "Stuck in your head, on repeat, unanswered",
        "with": "Asked out loud — 4 open readings for anything you need to ask"
      },
      {
        "criterion": "What it costs you",
        "without": "One more program that blames your body and bills you monthly",
        "with": "From $9.99/month, unlimited readings, cancel anytime, 7-day refund"
      }
    ],
    "authority": "Over 120,000 readings delivered, rated 4.9 by the people who received them.\nEvery reading uses the Egyptian tarot — 22 major arcana — interpreted through your own quiz answers, not a recycled script.\nNo two readings are alike, because no two patterns are.\nMaster Aura writes for one person at a time: you.",
    "value": [
      {
        "benefit": "Finally see the pattern behind your restarts, named and explained",
        "feature": "Your first reading — your Pattern Mirror: the complete, personalized reading of the dominant pattern from your quiz"
      },
      {
        "benefit": "Ask the questions you'd never say out loud — and get a real answer",
        "feature": "4 additional readings on any question you choose"
      },
      {
        "benefit": "Get your answer while the moment still matters, not next week",
        "feature": "Instant delivery — your readings appear minutes after checkout"
      },
      {
        "benefit": "Return to your reading whenever the loop tries to start again",
        "feature": "Readings never expire and stay saved in your account"
      },
      {
        "benefit": "Change your mind without losing a cent",
        "feature": "7-day full money-back guarantee, handled by a simple email"
      }
    ],
    "priceLine": "All of this from just $9.99 a month — unlimited readings, cancel anytime. Or one payment: $39.99 for 6 months, $59.99 for a year.",
    "guarantee": "Read everything. Sit with it for a full week. If your reading doesn't show you something true about your pattern, email us within 7 days and we'll refund every cent. No forms, no phone calls, no guilt trip. You risk nothing — the only thing that can't be undone is finally seeing the loop.",
    "faq": [
      {
        "q": "How much time does this actually take?",
        "a": "About three minutes to check out and open your first reading. It arrives minutes after payment, and you read it whenever you want — your readings never expire."
      },
      {
        "q": "Does it work if I'm starting from zero and have never had a tarot reading?",
        "a": "Yes. Your first reading is built from your quiz answers, so it starts from your pattern — not from tarot knowledge. Everything is written in plain language, no symbols left unexplained."
      },
      {
        "q": "What if I don't even know what to ask?",
        "a": "You don't need to. Your first reading is already done for you: the full reading of the pattern your quiz revealed. For the other four, the questions tend to show up on their own after you read the first."
      },
      {
        "q": "Why is it only $9.99?",
        "a": "Because $9.99 a month should be easy to say yes to — and easy to leave. Unlimited readings, cancel anytime in two taps, and a 7-day refund if it isn't for you."
      }
    ],
    "ctaB": "Your pattern already has a name. Read it in the next 10 minutes. [Start unlimited readings — $9.99/mo] Cancel anytime · Instant access · 7-day money-back guarantee"
  }
};
