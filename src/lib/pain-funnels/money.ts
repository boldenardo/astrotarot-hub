// Config da variante MONEY — copy gerada pela execução dos
// agentes originais do Ignite System (01-ICP → 03-Validador → 06-Hook
// Writer → 08-LP Copywriter) e passada por revisão adversarial de claims.
// Score do Validador: 7.5 — AVANÇA COM AJUSTES.
//
// Vendemos LEITURA, nunca desfecho: nada aqui promete resultado externo.
// Estrutura obrigatória do LP Copywriter validada por script no build
// deste arquivo (3 parágrafos, 5 critérios, 4 FAQs, 7 interações).

import type { PainFunnelConfig } from "./types";

export const MONEY_CONFIG: PainFunnelConfig = {
  "segment": "money",
  "pageTitle": "The Loop Your Money Keeps Running",
  "hook": {
    "line": "You get paid, and you get about one good day before the bracing starts again. It's not the amount. It's the loop — and no one has ever once named it for you.",
    "sub": "Seven quick questions about the cycle — then one card shows the pattern your answers keep pointing to.",
    "cta": "Read my pattern"
  },
  "quiz": [
    {
      "id": "q1",
      "stage": "situacao",
      "aura": [
        "Hey. I'm Aura. Before we touch any cards, I want to know where you actually are — not the version you tell people.",
        "Let's start simple. Be honest with me; I can't read a mask."
      ],
      "question": "Which one sounds most like your money right now?",
      "options": [
        {
          "id": "a",
          "label": "It comes in, it goes out, and I honestly couldn't tell you where.",
          "pattern": "silent_leak"
        },
        {
          "id": "b",
          "label": "It's technically fine — but I'm always waiting for something to go wrong.",
          "pattern": "braced_guard"
        },
        {
          "id": "c",
          "label": "I'm always paying for last month. Never actually living in this one.",
          "pattern": "endless_catchup"
        },
        {
          "id": "d",
          "label": "I don't look too closely. It's easier that way.",
          "pattern": "quiet_avoider"
        }
      ]
    },
    {
      "id": "q2",
      "stage": "sensacao_entrada",
      "aura": [
        "Okay. Now the part that's hardest to say out loud."
      ],
      "question": "When money actually comes in — payday, a payment, whatever — what's the first feeling?",
      "options": [
        {
          "id": "a",
          "label": "Relief. For about a day. Then it's gone from my body.",
          "pattern": "braced_guard"
        },
        {
          "id": "b",
          "label": "I'm already subtracting. It's spent before it even lands.",
          "pattern": "endless_catchup"
        },
        {
          "id": "c",
          "label": "A little rush — then guilt the moment I spend any of it.",
          "pattern": "quiet_avoider"
        },
        {
          "id": "d",
          "label": "Honestly? Nothing. It stopped feeling real a while ago.",
          "pattern": "silent_leak"
        }
      ],
      "reaction": "That's the answer people have usually rehearsed at 2am long before anyone asks. I hear you."
    },
    {
      "id": "q3",
      "stage": "relaxar",
      "aura": [
        "Tell me the truth on this one. Not the strong version — the real one."
      ],
      "question": "When was the last time you spent on yourself without doing math in your head first?",
      "options": [
        {
          "id": "a",
          "label": "I always do the math. Always. Even on small things.",
          "pattern": "braced_guard"
        },
        {
          "id": "b",
          "label": "I spend — and then I pay for it with guilt for days.",
          "pattern": "quiet_avoider"
        },
        {
          "id": "c",
          "label": "I can't remember. That's the honest answer.",
          "pattern": "silent_leak"
        },
        {
          "id": "d",
          "label": "Only when I pretend the other bills don't exist for a night.",
          "pattern": "endless_catchup"
        }
      ]
    },
    {
      "id": "q4",
      "stage": "olhar_conta",
      "aura": [
        "This next one is the one people lie to themselves about. Don't."
      ],
      "question": "What happens inside you right before you open your banking app?",
      "options": [
        {
          "id": "a",
          "label": "A small dread. Every single time.",
          "pattern": "quiet_avoider"
        },
        {
          "id": "b",
          "label": "I brace. Like I'm about to get bad news.",
          "pattern": "braced_guard"
        },
        {
          "id": "c",
          "label": "I check obsessively — as if watching it will change it.",
          "pattern": "endless_catchup"
        },
        {
          "id": "d",
          "label": "I avoid it until I absolutely have to.",
          "pattern": "silent_leak"
        }
      ]
    },
    {
      "id": "q5",
      "stage": "ciclo",
      "aura": [
        "Now the important one.",
        "Every person I've ever read carries one loop — one scene that keeps replaying with different details each time."
      ],
      "question": "Which scene keeps replaying in yours?",
      "options": [
        {
          "id": "a",
          "label": "I get slightly ahead — and something 'unexpected' wipes it out.",
          "pattern": "braced_guard"
        },
        {
          "id": "b",
          "label": "New month, new plan, same ending.",
          "pattern": "endless_catchup"
        },
        {
          "id": "c",
          "label": "Money arrives, money evaporates, and I can't point to where.",
          "pattern": "silent_leak"
        },
        {
          "id": "d",
          "label": "I promise myself I'll face it properly 'next month.'",
          "pattern": "quiet_avoider"
        }
      ],
      "reaction": "However long that one took you — the loop always knows its own name."
    },
    {
      "id": "q6",
      "stage": "proximos_meses",
      "aura": [
        "Almost there. Now look forward for me — not back."
      ],
      "question": "When you think about the next few months, what actually comes up?",
      "options": [
        {
          "id": "a",
          "label": "A quiet fear that it'll just be more of the same.",
          "pattern": "endless_catchup"
        },
        {
          "id": "b",
          "label": "Tired hope. I want to believe it'll be different this time.",
          "pattern": "silent_leak"
        },
        {
          "id": "c",
          "label": "I don't think ahead. Thinking ahead costs too much.",
          "pattern": "quiet_avoider"
        },
        {
          "id": "d",
          "label": "A knot. Something's coming — I can feel it.",
          "pattern": "braced_guard"
        }
      ]
    },
    {
      "id": "q7",
      "stage": "identidade",
      "aura": [
        "Last one. This is the one I actually read the cards through, so give it to me straight."
      ],
      "question": "Deep down, who do you feel you've become around money?",
      "options": [
        {
          "id": "a",
          "label": "The one who holds everything together and can never put it down.",
          "pattern": "braced_guard"
        },
        {
          "id": "b",
          "label": "The one who's always almost okay.",
          "pattern": "endless_catchup"
        },
        {
          "id": "c",
          "label": "The one who should have figured this out by now.",
          "pattern": "quiet_avoider"
        },
        {
          "id": "d",
          "label": "The one watching everyone else move forward.",
          "pattern": "silent_leak"
        }
      ]
    }
  ],
  "transition": [
    "Okay. I see it now. What you've been calling 'bad with money' has a shape — a loop with a trigger, a repeat, and a very specific place where it grabs you. You've lived inside it so long you started thinking it's your personality. It isn't.",
    "And this is exactly where the cards earn their place. Not to predict a windfall — I don't do that, and I'd walk away from anyone who says they do. The Egyptian arcana work as mirrors: you can't see a loop from inside it, but a card held up at the right angle can show you the part of the pattern your own eyes keep skipping.",
    "The deck is in front of you. Twenty-two arcana, and your answers have already narrowed which ones matter. Don't overthink it — your hand knows things your budget never did. Pick one card."
  ],
  "patterns": [
    {
      "id": "silent_leak",
      "label": "The Silent Leak",
      "description": "O dinheiro entra e evapora sem que a pessoa consiga apontar para onde foi. Sensação de irrealidade no pagamento, memória curta dos gastos, e a pergunta 'onde foi parar?' no fim do mês. A dor central é a invisibilidade do próprio padrão."
    },
    {
      "id": "braced_guard",
      "label": "The Braced Guard",
      "description": "Tecnicamente as contas fecham, mas o corpo nunca desarma: um dia de alívio no pagamento e depois a espera pelo próximo golpe. A despesa 'inesperada' virou personagem fixo. Vive em prontidão, não consegue relaxar nem quando pode."
    },
    {
      "id": "endless_catchup",
      "label": "The Endless Catch-Up",
      "description": "Sempre pagando o mês passado, nunca vivendo o atual. Todo mês começa com plano novo e termina no mesmo lugar. O dinheiro chega já subtraído. A dor central é correr sem nunca cruzar a linha de chegada."
    },
    {
      "id": "quiet_avoider",
      "label": "The Quiet Avoider",
      "description": "Evita olhar a conta porque olhar dói: pavor antes de abrir o app, culpa depois de qualquer gasto próprio, promessa eterna de 'encarar isso direito mês que vem'. A dor central é a vergonha silenciosa que ninguém vê."
    }
  ],
  "cards": [
    {
      "number": 10,
      "name": "Wheel of Fortune",
      "interpretation": "This card can symbolize a turning that keeps returning to the same point — movement without arrival. Within your reading, it often marks the moment a person stops blaming the spin of the wheel and starts looking at the hand that sets it spinning.",
      "patternLine": "For someone carrying {pattern}, the Wheel doesn't ask what's coming in — it asks what keeps coming back."
    },
    {
      "number": 15,
      "name": "The Devil",
      "interpretation": "This card can symbolize a chain that has learned to look like a necessity — the thing you keep feeding because letting go feels more dangerous than holding on. Within your reading, it tends to point at the quiet agreements you made with scarcity long before you had a say in them.",
      "patternLine": "Drawn against {pattern}, this card usually names the tie you've been mistaking for a fact of life."
    },
    {
      "number": 14,
      "name": "Temperance",
      "interpretation": "This card can symbolize the flow between two vessels — what enters, what leaves, and the steadiness of the hand doing the pouring. Within your reading, it often surfaces for someone who has been managing everything except the current running underneath it all.",
      "patternLine": "Held next to {pattern}, Temperance asks where the flow breaks — not how much runs through it."
    },
    {
      "number": 16,
      "name": "The Tower",
      "interpretation": "This card can symbolize the strike that keeps arriving 'out of nowhere' — until you notice it always lands on the same wall. Within your reading, it tends to mark the unexpected expense that is never quite as unexpected as it feels.",
      "patternLine": "Read through {pattern}, the Tower asks a harder question: what has this repeating collapse been protecting you from seeing?"
    }
  ],
  "openLoop": {
    "surfaceLine": "That's the surface of your card — the part I can hand you in a free pull. It's true, but it's the thinnest layer.",
    "card2": "The second layer reads this same card against your dominant loop: where it started, what triggers it, and the exact point in the cycle where you keep making the same move without ever noticing you're making it.",
    "card3": "The third layer is the one I would read first if this loop were mine: what this loop has been quietly costing you beyond money — and the one thread that, pulled first, loosens all the others.",
    "cta": "Your full reading is already taking shape from your answers. Unlock it now — then unlimited readings for every question you've been carrying alone. From $9.99 a month. It starts the moment you do."
  },
  "lp": {
    "headline": "See the exact pattern behind your money cycle in the next 10 minutes — with one card and seven honest answers — even if you've already tried every budget app.",
    "subheadline": "Answer honestly, pull one card, and your full personal reading arrives in minutes — the first clear look at the loop that keeps pulling you back.",
    "connection": [
      "Everyone told you it's about how much comes in. But the tightness survived your raise. It survived the side gig. More money entered the loop — and the loop stayed.",
      "You know that person who seems calm at the checkout? No mental math, no flinch at the card machine. You don't envy their money. You envy their quiet. That quiet is what life without the loop feels like.",
      "So you tried the apps. The spreadsheets. The no-spend month. Two good weeks, then one 'unexpected' expense, and you're back at the start — with fresh proof that you're the problem. You were never the problem. The unread pattern was."
    ],
    "comparison": [
      {
        "criterion": "Payday",
        "without": "One day of relief, then the bracing starts again",
        "with": "You know which part of your loop payday triggers — and which move is actually yours to make"
      },
      {
        "criterion": "The 'unexpected' expense",
        "without": "Feels like the universe picking on you, again",
        "with": "Recognized as a repeating scene inside a pattern that finally has a name"
      },
      {
        "criterion": "Opening your banking app",
        "without": "A small dread you've stopped mentioning to anyone",
        "with": "A number to deal with — not a verdict on who you are"
      },
      {
        "criterion": "Money advice",
        "without": "Generic tips written for someone who isn't in the loop",
        "with": "A reading built from your answers and the card you pulled"
      },
      {
        "criterion": "The story you tell yourself",
        "without": "'I'm just bad with money'",
        "with": "'I carry a pattern — and I've finally seen it'"
      }
    ],
    "authority": "Over 40,000 readings delivered, rated 4.9 by the people who received them. Every reading combines the Egyptian Tarot — 22 major arcana — with your own quiz answers. No scripts, no recycled horoscopes: your reading is written for your pattern, not for your zodiac sign's crowd. And to be clear about what we are: we don't predict windfalls and we don't promise money. We read patterns. That's the work.",
    "value": [
      {
        "benefit": "Finally hear your loop named out loud",
        "feature": "Reading #1: the complete interpretation of your dominant pattern from the quiz, read through the card you pulled"
      },
      {
        "benefit": "Ask the questions you've never said to anyone",
        "feature": "4 more full readings — any question, in your own words"
      },
      {
        "benefit": "Get answers at 2am, when the loop is loudest",
        "feature": "Instant delivery after payment, plus the Spiritual Guide available 24/7"
      },
      {
        "benefit": "Never lose a single insight",
        "feature": "Every reading saved to your account — your full history, always there"
      }
    ],
    "priceLine": "All of this from just $9.99 a month — unlimited readings, cancel anytime. Or one payment: $39.99/6 months, $59.99/year.",
    "guarantee": "Read your first reading in full. Sit with it for a week. If it doesn't show you something true about your pattern, email us within 7 days and we refund every cent — no forms, no questions, no convincing us. You're risking seven days of curiosity. That's all.",
    "faq": [
      {
        "q": "How much time does this actually take?",
        "a": "Confirmar tempo mediano real do quiz de 7 perguntas antes de publicar; se acima de ~2min, usar 'The quiz takes a few minutes.' Your full reading arrives within minutes of payment. Read it in one sitting or come back to it at 2am — it's yours, and it doesn't expire."
      },
      {
        "q": "Does it work if I'm starting from zero — I've never touched tarot?",
        "a": "Yes. You don't interpret anything yourself. You answer, you pull one card, and your reading arrives written in plain language. Zero experience needed."
      },
      {
        "q": "What if I don't know my exact birth time — or anything about astrology?",
        "a": "You don't need to. Your reading is built from your quiz answers and the card you drew — it stands on its own."
      },
      {
        "q": "Why is it only $9.99?",
        "a": "Because $9.99 a month with unlimited readings means you can genuinely test the work — and cancel in two taps if it doesn't hold up. We're comfortable being judged month by month."
      }
    ],
    "ctaB": "Your reading starts being written the moment you complete payment. [Start my first reading] Unlimited readings, cancel anytime, 7-day money-back guarantee."
  }
};
