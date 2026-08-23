// F5 — EX-BACK (/f/ex-back/v1): reconquista.
//
// O baralho PRESCREVE movimentos ("o que as cartas mandam você fazer") e
// a reconciliação é sempre uma POSSIBILIDADE lida nas cartas — nunca uma
// promessa. Direção do dono (22/08): copy vende a prescrição; a leitura
// entrega janela, não garantia. Movimentos sempre dignos (silêncio, a
// mensagem que NÃO se envia, aparecer mudado) — nunca manipulação.
//
// Gerado pelo pipeline Ignite (dossiê → config → revisão adversarial,
// run wf_ccdf22c2-2d5, veredito SHIP_WITH_FIXES 7.5, 11 correções
// aplicadas — todas convertendo afirmações sobre o estado interno do ex
// em leitura condicional). Fotos entram no registry (withImages).
//
// Segmento "exback" próprio: a sessão (astro_pain_exback) não colide com
// o /quiz/ex (release) — são desejos opostos do mesmo público.

import type { PainFunnelConfig } from "@/lib/pain-funnels/types";

export const EXBACK_V1: PainFunnelConfig = {
  "segment": "exback",
  "pageTitle": "What the Cards Say to Do to Win Your Ex Back",
  "hook": {
    "line": "The cards won't promise your ex back. They'll tell you the message not to send.",
    "sub": "A 2-minute reading that ends in instructions — the silence, the one message, the timing. A window, not a guarantee.",
    "cta": "Ask the cards what to do"
  },
  "genderQuestionId": "gender",
  "quiz": [
    {
      "id": "gender",
      "stage": "opening",
      "aura": [
        "I'm going to ask you about the one you still check on.",
        "The cards won't promise them back. But they carry instructions — moves to make, and one thing to stop doing.",
        "First — who am I reading for?"
      ],
      "question": "Who's asking tonight?",
      "options": [
        {
          "id": "woman",
          "label": "I'm a woman",
          "pattern": "none",
          "reaction": "Then the cards and I will speak about {him} plainly — no pity, no lectures. You've had enough of both."
        },
        {
          "id": "man",
          "label": "I'm a man",
          "pattern": "none",
          "reaction": "You haven't told anyone you're looking for this. You don't have to. The deck doesn't need witnesses — just honesty."
        }
      ]
    },
    {
      "id": "w_clock",
      "stage": "clock",
      "gender": "woman",
      "aura": [
        "Let's place it in time. Not roughly — precisely.",
        "The cards read six weeks very differently from six months."
      ],
      "question": "How long since it ended?",
      "options": [
        {
          "id": "under_month",
          "label": "Under a month",
          "pattern": "none",
          "reaction": "Still raw. Good to know — the cards won't ask you for what you can't hold yet."
        },
        {
          "id": "one_three",
          "label": "One to three months",
          "pattern": "none",
          "reaction": "The limbo months. Long enough to think clearly. Not long enough to stop counting."
        },
        {
          "id": "three_six",
          "label": "Three to six months",
          "pattern": "none",
          "reaction": "That long, and you're still here. That's not weakness — that's unfinished."
        },
        {
          "id": "longer",
          "label": "Longer — and I'm still here",
          "pattern": "none",
          "reaction": "Past the point where friends stopped asking. The cards didn't stop."
        }
      ]
    },
    {
      "id": "w_ending",
      "stage": "ending",
      "gender": "woman",
      "aura": [
        "Now the part you've replayed the most.",
        "How did it actually end? Not the version you tell people — the real one."
      ],
      "question": "How did it break?",
      "options": [
        {
          "id": "blowup",
          "label": "One fight that got too big",
          "pattern": "storm_exit",
          "reaction": "A blowup ending. The words were bigger than the feeling under them — the cards will want to know which one survives."
        },
        {
          "id": "faded",
          "label": "It faded until someone said it out loud",
          "pattern": "slow_dimming",
          "reaction": "Nothing broke. It starved. That matters — what dimmed isn't destroyed the way what shattered is."
        },
        {
          "id": "no_reason",
          "label": "{He} left — the reason never made sense",
          "pattern": "unfinished_door",
          "reaction": "No real reason means no real ending. That's why it won't close — for you, and maybe not for {him} either."
        },
        {
          "id": "mutual",
          "label": "We called it mutual. It wasn't.",
          "pattern": "pride_standoff",
          "reaction": "'Mutual' is what two proud people call a standoff. Neither of you stopped. You just stopped reaching."
        }
      ]
    },
    {
      "id": "w_wire",
      "stage": "wire",
      "gender": "woman",
      "aura": [
        "Where does contact stand tonight? Be exact.",
        "I'm not going to flinch at the answer. Nobody here does."
      ],
      "question": "What's between you and {him} right now?",
      "options": [
        {
          "id": "careful_talk",
          "label": "We still talk — carefully",
          "pattern": "unfinished_door",
          "reaction": "A live wire. Careful talk means the door isn't shut — it means neither of you trusts the handle yet."
        },
        {
          "id": "seen_no_reply",
          "label": "{He} sees my messages. No reply.",
          "pattern": "pride_standoff",
          "reaction": "Seen and unanswered. That silence is a message too — the cards will read what it's actually saying."
        },
        {
          "id": "total_silence",
          "label": "Total silence. Neither breaks it.",
          "pattern": "pride_standoff",
          "reaction": "Two silences, holding. Someone strong enough will have to send a signal. The cards will say if it's you — and when."
        },
        {
          "id": "watching",
          "label": "No contact — but I watch {his} stories",
          "pattern": "slow_dimming",
          "reaction": "You watch. {He} may feel it more than you think. The cards will likely start there — with what you stop."
        }
      ]
    },
    {
      "id": "w_confession",
      "stage": "confession",
      "gender": "woman",
      "aura": [
        "Now the question you ask the ceiling at 2am.",
        "What do you think was your mistake? There's no wrong answer here — including not knowing."
      ],
      "question": "If it was something you did — what was it?",
      "options": [
        {
          "id": "held_tight",
          "label": "I held on too tight",
          "pattern": "storm_exit",
          "reaction": "Holding tight isn't a crime. But grip reads as fear, and fear got loud. The cards separate the love from the noise."
        },
        {
          "id": "went_cold",
          "label": "I went cold when it mattered",
          "pattern": "slow_dimming",
          "reaction": "You went cold to protect something. {He} read it as leaving early. The cards deal with what the cold was covering."
        },
        {
          "id": "said_it",
          "label": "I said something I can't take back",
          "pattern": "storm_exit",
          "reaction": "One sentence, still ringing. Words that big are rarely the truth — the cards will weigh what was under it."
        },
        {
          "id": "dont_know",
          "label": "I don't know — and that's the worst part",
          "pattern": "unfinished_door",
          "reaction": "Not knowing is an answer. It means the ending happened somewhere you couldn't see — which is exactly where cards look."
        }
      ]
    },
    {
      "id": "w_ember",
      "stage": "ember",
      "gender": "woman",
      "aura": [
        "Now tell me the thing you haven't told anyone.",
        "What makes you feel this isn't over? I'm treating it as data, not delusion."
      ],
      "question": "What keeps the ember lit?",
      "options": [
        {
          "id": "he_watches",
          "label": "{He} still watches everything I post",
          "pattern": "pride_standoff",
          "reaction": "Watching without speaking. That's not indifference — indifference doesn't check. The cards read watchers precisely."
        },
        {
          "id": "last_words",
          "label": "The last thing {he} said to me",
          "pattern": "unfinished_door",
          "reaction": "A last line that sounded like a bookmark, not an ending. The cards will tell you whether to believe it."
        },
        {
          "id": "dream",
          "label": "A dream that felt like a message",
          "pattern": "slow_dimming",
          "reaction": "Dreams carry what daylight censors. I won't laugh at that. The deck takes the night shift seriously."
        },
        {
          "id": "certainty",
          "label": "No proof. Just a certainty in my body",
          "pattern": "unfinished_door",
          "reaction": "The body keeps score before the mind admits it. A certainty like that deserves a real reading — not a shrug."
        }
      ]
    },
    {
      "id": "w_hand",
      "stage": "hand",
      "gender": "woman",
      "aura": [
        "Last one. It's the only question that matters.",
        "If the cards asked for nine days of silence — or told you NOT to send the message you've drafted — could you do it?"
      ],
      "question": "If the deck asks something hard of you —",
      "options": [
        {
          "id": "yes_full",
          "label": "Yes. Tell me and I'll do it.",
          "pattern": "none",
          "reaction": "That's what I needed to hear. The cards are direct with people who can take direction."
        },
        {
          "id": "hard_yes",
          "label": "The silence would be hard. But yes.",
          "pattern": "none",
          "reaction": "Honest. The silence is always the hardest ask — the deck knows, and it never asks it as punishment."
        },
        {
          "id": "need_why",
          "label": "I'd need to understand why first",
          "pattern": "none",
          "reaction": "Good. The deck doesn't deal blind orders — every move arrives with its reason face up. You'll see the why. Then you decide."
        },
        {
          "id": "not_sure",
          "label": "I don't know if I'm strong enough yet",
          "pattern": "none",
          "reaction": "Strong enough isn't a requirement. Willing is. The cards will meet you where your hands are tonight."
        }
      ]
    },
    {
      "id": "m_clock",
      "stage": "clock",
      "gender": "man",
      "aura": [
        "Alright. Just you, me, and the deck — and the deck only deals in exact answers.",
        "First — put it on the clock. How long since it ended?"
      ],
      "question": "How long has it been?",
      "options": [
        {
          "id": "under_month",
          "label": "Under a month",
          "pattern": "none",
          "reaction": "Fresh. You're still in the part where every day has {his} name on it. The cards won't waste that — they'll aim it."
        },
        {
          "id": "one_three",
          "label": "One to three months",
          "pattern": "none",
          "reaction": "The limbo stretch. You function all day and lose the argument with yourself at night. Noted."
        },
        {
          "id": "three_six",
          "label": "Three to six months",
          "pattern": "none",
          "reaction": "Months of holding it alone. That's not stubbornness — that's something refusing to file itself as over."
        },
        {
          "id": "longer",
          "label": "Longer than I'd say out loud",
          "pattern": "none",
          "reaction": "Longer than pride admits. You're still here, though. That's the only data point that matters tonight."
        }
      ]
    },
    {
      "id": "m_ending",
      "stage": "ending",
      "gender": "man",
      "aura": [
        "How it ended is the blueprint of what's still open.",
        "Give it to me straight — not the version with your dignity edited in."
      ],
      "question": "How did it actually end?",
      "options": [
        {
          "id": "fight",
          "label": "A fight neither of us walked back",
          "pattern": "storm_exit",
          "reaction": "Neither walked it back. Two people guarding the same wound. The cards care about what the fight was protecting."
        },
        {
          "id": "went_quiet",
          "label": "It went quiet long before it went dark",
          "pattern": "slow_dimming",
          "reaction": "Quiet before dark. Nothing exploded — the current just got cut. That kind can be rewired. Sometimes."
        },
        {
          "id": "no_why",
          "label": "{He} ended it — I never got the real why",
          "pattern": "unfinished_door",
          "reaction": "No real why means your head built a hundred of them. The cards deal in the one that's actually true."
        },
        {
          "id": "let_die",
          "label": "We both let it die rather than lose",
          "pattern": "pride_standoff",
          "reaction": "Losing felt worse than leaving, so you both left. A standoff isn't an ending. It's a stalled game."
        }
      ]
    },
    {
      "id": "m_wire",
      "stage": "wire",
      "gender": "man",
      "aura": [
        "Where's contact right now? Exact status.",
        "This stays between you and the deck."
      ],
      "question": "What's the line between you and {him}?",
      "options": [
        {
          "id": "surface_talk",
          "label": "We talk sometimes. It's surface.",
          "pattern": "unfinished_door",
          "reaction": "Surface talk with deep water under it. The cards will tell you when — and whether — to drop below the small talk."
        },
        {
          "id": "wont_text_first",
          "label": "I won't text first. Neither will {he}.",
          "pattern": "pride_standoff",
          "reaction": "Two people waiting to be texted first. That's not over. That's a contest nobody entered on purpose."
        },
        {
          "id": "read_no_reply",
          "label": "Read. No reply. I stopped trying.",
          "pattern": "pride_standoff",
          "reaction": "You stopped trying out loud. Not inside. There's a difference, and the deck reads the inside one."
        },
        {
          "id": "check_page",
          "label": "Silence — but I still check {his} page",
          "pattern": "slow_dimming",
          "reaction": "Checking the page is contact — one-directional, and it costs only you. Expect the cards to address it first."
        }
      ]
    },
    {
      "id": "m_confession",
      "stage": "confession",
      "gender": "man",
      "aura": [
        "Here's the question you don't ask anyone.",
        "What was your part in it? A plan only works if this part is honest."
      ],
      "question": "Your mistake — name it.",
      "options": [
        {
          "id": "shut_down",
          "label": "I shut down instead of talking",
          "pattern": "slow_dimming",
          "reaction": "Shutting down felt like control. It read as absence. The moves the deck gives you will be visible ones."
        },
        {
          "id": "pride_talked",
          "label": "I let my pride do the talking",
          "pattern": "storm_exit",
          "reaction": "Pride talks loud and apologizes never. The cards won't ask you to grovel — they'll ask you to go first. Once."
        },
        {
          "id": "took_granted",
          "label": "I took {him} for granted",
          "pattern": "slow_dimming",
          "reaction": "Granted is how good things die quietly. What was taken for granted can be seen again — if the change is real."
        },
        {
          "id": "cant_name",
          "label": "I still can't name it — that's the problem",
          "pattern": "unfinished_door",
          "reaction": "Then that's the first thing the cards find. You can't fix what you can't name — naming it is the reading's job."
        }
      ]
    },
    {
      "id": "m_ember",
      "stage": "ember",
      "gender": "man",
      "aura": [
        "Now the evidence. What tells you it isn't done?",
        "You've kept this one to yourself. Good instinct. Wrong audience — until now."
      ],
      "question": "What's the sign you can't dismiss?",
      "options": [
        {
          "id": "watches_stories",
          "label": "{He} still watches my stories",
          "pattern": "pride_standoff",
          "reaction": "Watching without a word — that's a held breath, not a closed door. The cards read held breaths well."
        },
        {
          "id": "last_call",
          "label": "The way the last call ended",
          "pattern": "unfinished_door",
          "reaction": "Endings that end mid-sentence don't file as endings. Some part of {him} knows that too."
        },
        {
          "id": "everywhere",
          "label": "A song, a place — {he}'s everywhere lately",
          "pattern": "slow_dimming",
          "reaction": "The world keeps handing you {him}. That's your attention, not fate — but attention like that is information."
        },
        {
          "id": "just_know",
          "label": "Nothing solid. I just know.",
          "pattern": "unfinished_door",
          "reaction": "'I just know' is the one signal that survives no-contact. The deck will tell you if it's an echo or a pulse."
        }
      ]
    },
    {
      "id": "m_hand",
      "stage": "hand",
      "gender": "man",
      "aura": [
        "Last question. It decides what kind of reading you get.",
        "If the cards said: nine days of silence, then one message — and after that, hands off the board, whatever {he} does. Could you run that play?"
      ],
      "question": "If the deck hands you a hard play —",
      "options": [
        {
          "id": "run_it",
          "label": "Run it. I just need the plan.",
          "pattern": "none",
          "reaction": "Then it comes straight — moves, order, timing. The deck is bluntest with the ones who can take it."
        },
        {
          "id": "if_why",
          "label": "If the why makes sense — yes.",
          "pattern": "none",
          "reaction": "Good. Every move comes with its reason. You'll never be asked to act blind."
        },
        {
          "id": "message_scares",
          "label": "Silence I can do. One message scares me.",
          "pattern": "none",
          "reaction": "The message is where pride pays the toll. The cards keep it to one line — light, no question in it. You can carry one line."
        },
        {
          "id": "depends",
          "label": "Depends what it asks me to give up",
          "pattern": "none",
          "reaction": "Fair guard. Nothing the deck asks will cost your self-respect. That's the one currency it never spends."
        }
      ]
    }
  ],
  "transition": [
    "That's everything I need. Your answers just did something — they narrowed 22 cards down to four.",
    "Four cards, face down. One of them is carrying your pattern — the shape this thing between you and {him} keeps taking.",
    "Turn one when you're ready. Your hand knows which."
  ],
  "patterns": [
    {
      "id": "unfinished_door",
      "label": "The Unfinished Door",
      "description": "It ended before the conversation did. What was never said is holding the door ajar — and the cards read a draft on {his} side too. Doors like this don't close on their own. They close, or open, by what you do next."
    },
    {
      "id": "pride_standoff",
      "label": "The Pride Standoff",
      "description": "You stopped reaching before you stopped feeling — and the cards read the same freeze on {his} side of the silence. The bond didn't break; the signal did. Someone strong enough has to send one signal. The cards will say whether it's you."
    },
    {
      "id": "slow_dimming",
      "label": "The Slow Dimming",
      "description": "Nothing broke this. Routine starved it — slowly enough that no one could name the day it went dark. What dimmed by neglect can't be relit with words. Only with change {he} can see without being told to look."
    },
    {
      "id": "storm_exit",
      "label": "The Storm Exit",
      "description": "The ending was louder than the love. Words got bigger than the feeling behind them, and the noise took the last word. The cards ask a different question: when the echo fades, what's still standing — and what will you do with it."
    }
  ],
  "cards": [
    {
      "number": 2,
      "name": "The High Priestess",
      "interpretation": "She sits between what you say and what you know. Her instruction is the hardest one: silence — not as punishment, as a reset. Your next word to {him} must not be an echo of your last one.",
      "patternLine": "In your spread she lands on {pattern} — the silence is where that pattern loosens its grip."
    },
    {
      "number": 6,
      "name": "The Lovers",
      "interpretation": "This card doesn't promise reunion. It marks a bond the cards still read as carried — on both sides — and a choice standing in front of it. The choice is a move, and the first move is yours to make.",
      "patternLine": "Crossed with {pattern}, it says the bond is intact underneath. The pattern is what needs the work — not {him}."
    },
    {
      "number": 14,
      "name": "Temperance",
      "interpretation": "The card of exact timing. Not yet, and not never — poured slowly, in the right measure. The reading it opens is about when: which night, which window, which word to hold back.",
      "patternLine": "Set against {pattern}, Temperance is the antidote — the pattern rushed what needed measure. This time, measure."
    },
    {
      "number": 20,
      "name": "Judgement",
      "interpretation": "The card of what can rise — sometimes — when it's called right. The cards will test whether what's filed as dead between you and {him} still has a pulse. If it does, it answers one kind of call only: made once, cleanly, from higher ground.",
      "patternLine": "Over {pattern}, Judgement asks for one clean call — made after the pattern has visibly broken, not before."
    }
  ],
  "preview": {
    "title": "Your card is up. Here's what it says — free.",
    "items": [
      {
        "label": "The pattern",
        "text": "The dynamic running between you and {him} is {pattern}. It explains the drafts you delete and the silence neither of you can read. Named, it stops steering."
      },
      {
        "label": "The first move the deck prescribes",
        "text": "Nine days of clean silence, starting tonight. No stories, no last-seen, no 'accidental' likes. Not a game — a reset, so your next word to {him} isn't an echo of the last argument. The cards see the door after the quiet, not before it."
      },
      {
        "label": "Tonight's sky",
        "text": "{moon} The deck reads timing off the real sky — your full reading marks which nights favor a first word, and which ask you to hold still."
      }
    ]
  },
  "openLoop": {
    "surfaceLine": "One card is up. Three are still face down — and {pattern} is only the surface of what they're holding.",
    "card2": "The second card holds the rest of the prescription: the moves after the silence, the exact message rule — one light line, no question inside it — and what to do if {he} reaches first.",
    "card3": "The third reads your timing against the real sky. {moon} The full reading marks the nights that favor a first word — and the ones that ask you to wait.",
    "cta": "Turn the remaining cards"
  },
  "lp": {
    "headline": "What the cards say to do about {him} — move by move",
    "subheadline": "The full reading turns your answers into instructions: the silence, the message rule, the timing, the change {he} has to see. A window, not a guarantee — and it starts tonight.",
    "connection": [
      "It's 2am and the thread is open again. You've written the message four times and sent it none. You know {his} last-seen better than your own schedule, and everyone who loves you keeps saying 'move on' — as if wanting {him} back were a symptom instead of a fact.",
      "Every get-your-ex-back video was made for everyone, which means it was made for no one. Thirty days of this, be mysterious, post like you're thriving. None of those scripts know how it ended, where contact stands tonight, or that the thing actually running between you two is {pattern}. Advice that doesn't know the pattern can only guess.",
      "So here's the honest version. The cards can't promise {he} comes back — nothing can, and anyone who says otherwise is selling the promise, not the truth. What the cards can do is read whether the door is still open, and hand you the moves that give it its best chance without costing you one inch of your self-respect. The guessing ends tonight. That part I can say plainly."
    ],
    "comparison": [
      {
        "criterion": "The advice",
        "without": "One-size scripts from strangers' breakups",
        "with": "Moves read from how yours actually ended"
      },
      {
        "criterion": "The promise",
        "without": "Guarantees no one can keep",
        "with": "A window read honestly — and what to do with it"
      },
      {
        "criterion": "The next step",
        "without": "Vibes, card meanings, 'trust the universe'",
        "with": "Instructions: the silence, the message, the timing"
      },
      {
        "criterion": "Your dignity",
        "without": "Jealousy games and scripts that shrink you",
        "with": "Only moves you'd stand behind in daylight"
      },
      {
        "criterion": "The 2am spiral",
        "without": "Open thread, drafted texts, deleted texts",
        "with": "A plan for tonight — and someone to ask at 2am"
      }
    ],
    "authority": "120,000+ readings delivered. Rated 4.9 — by people who were told the truth, not what they hoped to hear.",
    "value": [
      {
        "benefit": "Know exactly what to do about {him}",
        "feature": "Your full reading: the pattern, every prescribed move in order — the silence, the message rule, how to show up changed — and where the cards see the door"
      },
      {
        "benefit": "Never draft-and-delete alone at 2am again",
        "feature": "Spiritual Guide 24/7 — ask before you send anything, any hour, and get the deck's read first"
      },
      {
        "benefit": "Move on the right nights, not the desperate ones",
        "feature": "Timing read against the real sky — which windows favor a first word, and which ask for stillness"
      },
      {
        "benefit": "Whatever {he} does next, you'll know your move",
        "feature": "Unlimited readings — {his} reply, {his} silence, your next chapter, whatever the door does next"
      }
    ],
    "priceLine": "All of it is $9.99 a month. Cancel anytime, in two taps — no calls, no guilt. Less than one 2am delivery order you don't even taste because the thread is open.",
    "guarantee": "7-day money-back guarantee. If the reading doesn't tell you something true enough to act on, write us within 7 days and it's refunded. No forms, no interrogation.",
    "faq": [
      {
        "q": "Will this actually bring {him} back?",
        "a": "No one can promise you that — not a deck, not a psychic, not even {him}. What the cards can do is read whether the door is still open and tell you which move gives it its best chance without costing your dignity. It's a window, not a guarantee. Anyone promising the return is selling you the promise, not the truth."
      },
      {
        "q": "What if the cards say it's really over?",
        "a": "Sometimes they do. Master Aura won't dress a closed door as an open one — you'll be told plainly, and the moves shift to what protects and rebuilds you instead. Either way, the guessing ends tonight. That's the part that's been eating you."
      },
      {
        "q": "Is this jealousy games and playing hard to get?",
        "a": "No. The deck never prescribes anything you'd be ashamed of later. Silence to reset, not to punish. No jealousy bait, no fake accounts, nothing that makes you smaller. If a move would cost your self-respect, it isn't in the reading — the cards want {him} to meet someone worth returning to."
      },
      {
        "q": "Is this a subscription?",
        "a": "Yes — $9.99 a month, cancel anytime in two taps. No cancellation calls, no retention scripts. Stay while the door question is open; once it's answered, leave with our blessing. And there's a 7-day money-back guarantee either way."
      }
    ],
    "ctaB": "The cards have already dealt your next move. [See what the cards say to do] $9.99/month · cancel anytime · 7-day money-back guarantee"
  }
};
