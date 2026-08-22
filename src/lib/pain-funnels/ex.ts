// Funil de dor — segmento EX v3: "see what your ex says about you".
// Primeira pergunta = gênero → ramo feminino (ela deixou o marido/companheiro)
// ou masculino (a ex dele); a Aura reage depois de TODA pergunta; fotos da
// Aura no chat (public/funnel/ex). Pronomes do ex por token ({he} {him}
// {his}...) na copy compartilhada — o engine traduz pelo gênero.
// Copy: agentes Ignite + revisão adversarial (11 correções aplicadas).
//   - ICP (woman branch): the woman who LEFT her husband/partner — guilt at night despite the right decision, 'did I make a mistake?', his version (she aban
//   - ICP (man branch): his ex-wife/girlfriend moved on too fast; what she tells her friends; 'was I not enough?'; checking her profile and hating it; pride
//   - Idea validation: pain is urgent (nightly), evidenced by the existing ex funnel and ex-reading demand; differentiation = reading the bond from the OTHE
//   - Hook writer: 3 candidate angles were drafted (acute pain: 'You already know what your ex says about you. You just haven't let yourself hear it.'; coun
//   - LP headlines considered: (1) 'Read the Story {He} Tells About You — From {His} Side of the Bond' (chosen); (2) 'What {He} Says About You Now That You'
//   - Proof used only: '120,000+ readings delivered' and 4.9 rating. Zero testimonials, zero 'most women/men/people/members', no percentages in the comparis
//   - Honest framing: all ex-side statements use interpretive language (can speak to / often marks / suggests / tends to). No '{he} says X' or '{he} misses 
//   - Pronoun tokens used in all shared text (transition, patterns, cards, openLoop, lp): {he} {He} {him} {his} {His}. quizWoman uses he/him/his directly; q
//   - Every question in both branches carries a 'reaction' that works for any selected option (references 'that question/that sentence/that' generically). Q
//   - Egyptian arcana used: 18 The Twilight, 8 Themis, 9 The Veiled Lamp, 20 The Awakening (all within 1-22).

import type { PainFunnelConfig } from "./types";

export const EX_CONFIG: PainFunnelConfig = {
  "segment": "ex",
  "pageTitle": "See What Your Ex Says About You",
  "hook": {
    "line": "You already know what your ex says about you. You just haven't let yourself hear it.",
    "sub": "An Egyptian tarot reading of the bond from the other side — how you live in the story your ex tells now that you're gone.",
    "cta": "Hear it",
    "image": {
      "src": "/funnel/ex/hook-phone-2am.webp",
      "alt": "A phone glowing on a nightstand at 2 AM"
    }
  },
  "genderQuestionId": "gender",
  "transitionImage": {
    "src": "/funnel/ex/cards-velvet.webp",
    "alt": "Four Egyptian tarot cards face down on velvet"
  },
  "quiz": [
    {
      "id": "gender",
      "stage": "gender",
      "aura": [
        "Before we open anything, I want to get the voice right. The cards speak differently to the one who left and the one who was left.",
        "Tell me who I'm sitting with tonight."
      ],
      "question": "Am I speaking with a woman or a man?",
      "options": [
        {
          "id": "woman",
          "label": "A woman",
          "pattern": "none",
          "reaction": "Then I already suspect there's a version of you he tells — and you've never been allowed to hear it in full. Let's go slowly."
        },
        {
          "id": "man",
          "label": "A man",
          "pattern": "none",
          "reaction": "Then I already suspect there's a version of you she tells her friends — and you've been guessing at it for a while. Let's go slowly."
        }
      ]
    },
    {
      "id": "w1",
      "gender": "woman",
      "stage": "recognition",
      "aura": [
        "Women who leave rarely come to me for him. They come because of a question that shows up at night.",
        "Which one shows up for you?"
      ],
      "question": "It's 2 a.m. and your mind goes to him. What's the question?",
      "options": [
        {
          "id": "w1a",
          "label": "Does he regret it now?",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "w1b",
          "label": "What does he say about me now that I'm gone?",
          "pattern": "story_rewrote"
        },
        {
          "id": "w1c",
          "label": "Does he even say my name anymore?",
          "pattern": "name_avoids"
        },
        {
          "id": "w1d",
          "label": "Is she getting the version of him I never got?",
          "pattern": "quiet_comparison"
        }
      ],
      "reaction": "That question isn't weakness. It's the part of you that still wants the story told fairly — and nobody has told it fairly yet."
    },
    {
      "id": "w2",
      "gender": "woman",
      "stage": "situation",
      "aura": [
        "You were the one who left. People assume that makes it simpler. It doesn't.",
        "Tell me how it sits now."
      ],
      "question": "When you think about leaving, what's closest to the truth?",
      "options": [
        {
          "id": "w2a",
          "label": "It was right — and I still feel guilty at night",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "w2b",
          "label": "I'm relieved, and the relief makes me feel like a bad person",
          "pattern": "story_rewrote"
        },
        {
          "id": "w2c",
          "label": "Some days I still ask myself if I made a mistake",
          "pattern": "name_avoids"
        },
        {
          "id": "w2d",
          "label": "I'm rebuilding alone and pretending it's easy",
          "pattern": "quiet_comparison"
        }
      ],
      "reaction": "Relief and guilt in the same body — that's not a contradiction. It's what it feels like to be right and still grieve.",
      "image": {
        "src": "/funnel/ex/w-doorway.webp",
        "alt": "A woman in a doorway with a suitcase at dusk"
      }
    },
    {
      "id": "w3",
      "gender": "woman",
      "stage": "rehearsed thought",
      "aura": [
        "There's a version of the breakup he tells. You've heard pieces of it — through a friend, a cousin, a message that wasn't meant for you.",
        "Which line do you keep replaying?"
      ],
      "question": "In his version, who were you?",
      "options": [
        {
          "id": "w3a",
          "label": "The one who abandoned him",
          "pattern": "story_rewrote"
        },
        {
          "id": "w3b",
          "label": "The one who 'changed'",
          "pattern": "name_avoids"
        },
        {
          "id": "w3c",
          "label": "The difficult one — too much, too demanding",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "w3d",
          "label": "I honestly don't know — and that's worse",
          "pattern": "quiet_comparison"
        }
      ],
      "reaction": "Notice how much room his version takes up in you — and how little room yours has ever been given. The cards tend to flip that."
    },
    {
      "id": "w4",
      "gender": "woman",
      "stage": "behavior",
      "aura": [
        "Now something you don't say out loud.",
        "What do you actually do with all this?"
      ],
      "question": "Which one is you, more often than you'd admit?",
      "options": [
        {
          "id": "w4a",
          "label": "I check whether he's seen my stories — then hate that I checked",
          "pattern": "quiet_comparison"
        },
        {
          "id": "w4b",
          "label": "I defend myself in my head to people who never asked",
          "pattern": "story_rewrote"
        },
        {
          "id": "w4c",
          "label": "I draft a message explaining everything, then delete it",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "w4d",
          "label": "I act completely fine in front of everyone",
          "pattern": "name_avoids"
        }
      ],
      "reaction": "That isn't obsession. It's a woman still trying to close a door she's afraid is being described as if she slammed it.",
      "image": {
        "src": "/funnel/ex/w-awake.webp",
        "alt": "A woman awake at night, phone light on her face"
      }
    },
    {
      "id": "w5",
      "gender": "woman",
      "stage": "double fear",
      "aura": [
        "Two fears usually sit together here, and they contradict each other.",
        "Which one is louder?"
      ],
      "question": "What frightens you more?",
      "options": [
        {
          "id": "w5a",
          "label": "That I'm the villain in every story he tells",
          "pattern": "story_rewrote"
        },
        {
          "id": "w5b",
          "label": "That I've been erased — he doesn't speak of me at all",
          "pattern": "name_avoids"
        },
        {
          "id": "w5c",
          "label": "That he's quietly fine, and I'm the one still carrying it",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "w5d",
          "label": "That he tells her I was the lesson, not the love",
          "pattern": "quiet_comparison"
        }
      ],
      "reaction": "Being hated and being forgotten feel like opposites. They're the same wound — not being seen as you were."
    },
    {
      "id": "w6",
      "gender": "woman",
      "stage": "what you'd need to hear",
      "aura": [
        "Imagine his silence broke for one honest sentence.",
        "Don't choose the nice one. Choose the true one."
      ],
      "question": "What would you most need that sentence to be?",
      "options": [
        {
          "id": "w6a",
          "label": "'She didn't leave for nothing. I know what I did.'",
          "pattern": "story_rewrote"
        },
        {
          "id": "w6b",
          "label": "'I still think about her more than I'll admit.'",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "w6c",
          "label": "'She was never difficult. She was just done.'",
          "pattern": "name_avoids"
        },
        {
          "id": "w6d",
          "label": "'Nobody since has felt like her.'",
          "pattern": "quiet_comparison"
        }
      ],
      "reaction": "Read that sentence again. You didn't need him to come back. You needed him to tell the truth. Those are very different hungers."
    },
    {
      "id": "w7",
      "gender": "woman",
      "stage": "identity",
      "aura": [
        "Last one. Not about him.",
        "About who you're becoming on the other side of him."
      ],
      "question": "Which is closest to who you are right now?",
      "options": [
        {
          "id": "w7a",
          "label": "The woman who left and is still waiting to feel free",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "w7b",
          "label": "The woman who refuses to be the villain of someone else's story",
          "pattern": "story_rewrote"
        },
        {
          "id": "w7c",
          "label": "The woman who wants to stop flinching at his name",
          "pattern": "name_avoids"
        },
        {
          "id": "w7d",
          "label": "The woman who wants to stop measuring herself against who came next",
          "pattern": "quiet_comparison"
        }
      ],
      "reaction": "That's the woman the cards will read for — not the one he describes. Let me lay them out.",
      "image": {
        "src": "/funnel/ex/w-mirror.webp",
        "alt": "A woman alone in front of a mirror"
      }
    },
    {
      "id": "m1",
      "gender": "man",
      "stage": "recognition",
      "aura": [
        "Men rarely admit they come to me about her. They say it's curiosity.",
        "It's never curiosity at 2 a.m. Which question is it?"
      ],
      "question": "It's late, and your mind goes to her. What's the question?",
      "options": [
        {
          "id": "m1a",
          "label": "Does she still think about me?",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "m1b",
          "label": "What does she tell her friends about me?",
          "pattern": "story_rewrote"
        },
        {
          "id": "m1c",
          "label": "Was I just not enough?",
          "pattern": "quiet_comparison"
        },
        {
          "id": "m1d",
          "label": "Does she ever say my name, or am I just 'my ex' now?",
          "pattern": "name_avoids"
        }
      ],
      "reaction": "That question doesn't make you weak. It makes you a man who hasn't been given the ending — only the silence after it.",
      "image": {
        "src": "/funnel/ex/m-bedside.webp",
        "alt": "A man sitting on the edge of a bed at night, phone in hand"
      }
    },
    {
      "id": "m2",
      "gender": "man",
      "stage": "situation",
      "aura": [
        "Tell me where it stands. No pride in this room — it doesn't help the cards."
      ],
      "question": "What's closest to the truth right now?",
      "options": [
        {
          "id": "m2a",
          "label": "She moved on fast — too fast for it to have been real",
          "pattern": "quiet_comparison"
        },
        {
          "id": "m2b",
          "label": "She's gone quiet and I don't know what that silence means",
          "pattern": "name_avoids"
        },
        {
          "id": "m2c",
          "label": "I hear fragments of how she talks about me, and none of it sounds like me",
          "pattern": "story_rewrote"
        },
        {
          "id": "m2d",
          "label": "It never got a real ending. It just stopped.",
          "pattern": "unfinished_chapter"
        }
      ],
      "reaction": "However it stands, the part that hurts isn't her pace or her silence. It's how much of yourself you left in it — and how little of it seems to have come back."
    },
    {
      "id": "m3",
      "gender": "man",
      "stage": "rehearsed thought",
      "aura": [
        "There's a version of you that lives in her conversations. You've pieced it together from scraps.",
        "Which line stings the most?"
      ],
      "question": "In her version, what were you?",
      "options": [
        {
          "id": "m3a",
          "label": "The one who never really showed up",
          "pattern": "story_rewrote"
        },
        {
          "id": "m3b",
          "label": "The mistake she grew out of",
          "pattern": "quiet_comparison"
        },
        {
          "id": "m3c",
          "label": "The villain — cold, selfish, the reason it broke",
          "pattern": "name_avoids"
        },
        {
          "id": "m3d",
          "label": "I don't know, and the not knowing is eating me",
          "pattern": "unfinished_chapter"
        }
      ],
      "reaction": "Here's what nobody tells men: the version she tells is also a story about her. The cards read that side too.",
      "image": {
        "src": "/funnel/ex/m-bar.webp",
        "alt": "Two men talking at a dim bar"
      }
    },
    {
      "id": "m4",
      "gender": "man",
      "stage": "behavior",
      "aura": [
        "Now the thing you'd never say to your friends."
      ],
      "question": "Which one is you, more often than you'd admit?",
      "options": [
        {
          "id": "m4a",
          "label": "I check her profile, then hate myself for checking",
          "pattern": "quiet_comparison"
        },
        {
          "id": "m4b",
          "label": "I argue my side to her in my head, constantly",
          "pattern": "story_rewrote"
        },
        {
          "id": "m4c",
          "label": "I type a message, then delete it so I don't look weak",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "m4d",
          "label": "I act like I've forgotten her and it costs me every day",
          "pattern": "name_avoids"
        }
      ],
      "reaction": "Pride and missing her aren't enemies. Pride is just missing her with the door locked."
    },
    {
      "id": "m5",
      "gender": "man",
      "stage": "double fear",
      "aura": [
        "Two fears sit here, and they fight each other.",
        "Which one wins at night?"
      ],
      "question": "What frightens you more?",
      "options": [
        {
          "id": "m5a",
          "label": "That I'm the villain in every story she tells",
          "pattern": "story_rewrote"
        },
        {
          "id": "m5b",
          "label": "That I've been erased — she doesn't mention me at all",
          "pattern": "name_avoids"
        },
        {
          "id": "m5c",
          "label": "That the new one is getting a version of her I never got",
          "pattern": "quiet_comparison"
        },
        {
          "id": "m5d",
          "label": "That I'm still in it and she finished it months ago",
          "pattern": "unfinished_chapter"
        }
      ],
      "reaction": "Being hated and being forgotten feel opposite. Both are the same thing — not being seen as you actually were."
    },
    {
      "id": "m6",
      "gender": "man",
      "stage": "what you'd need to hear",
      "aura": [
        "Imagine she broke the silence with one honest sentence.",
        "Don't pick the one that flatters you. Pick the one you need."
      ],
      "question": "What would you most need that sentence to be?",
      "options": [
        {
          "id": "m6a",
          "label": "'He wasn't the villain. It was more complicated than I let people think.'",
          "pattern": "story_rewrote"
        },
        {
          "id": "m6b",
          "label": "'I still think about him. I just can't say it.'",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "m6c",
          "label": "'He was enough. I just wasn't ready.'",
          "pattern": "quiet_comparison"
        },
        {
          "id": "m6d",
          "label": "'I don't talk about him because it still hurts to.'",
          "pattern": "name_avoids"
        }
      ],
      "reaction": "Read it again. You didn't ask for her back. You asked for the record set straight. That's a different hunger — and a more honest one."
    },
    {
      "id": "m7",
      "gender": "man",
      "stage": "identity",
      "aura": [
        "Last one. Not about her. About who you are on the other side of this."
      ],
      "question": "Which is closest to who you are right now?",
      "options": [
        {
          "id": "m7a",
          "label": "The man who never got an ending and can't write one alone",
          "pattern": "unfinished_chapter"
        },
        {
          "id": "m7b",
          "label": "The man who refuses to be the villain in someone else's story",
          "pattern": "story_rewrote"
        },
        {
          "id": "m7c",
          "label": "The man who wants to stop checking and start living",
          "pattern": "quiet_comparison"
        },
        {
          "id": "m7d",
          "label": "The man who wants to hear his name without flinching",
          "pattern": "name_avoids"
        }
      ],
      "reaction": "That's the man the cards will read for — not the one in her version. Let me lay them out."
    }
  ],
  "transition": [
    "Thank you for not lying to me. It's easy to answer these for the person you wish you were.",
    "What you've described isn't about {him}. It's about how you live inside the story {he} tells — and how long you've been reading it from the outside.",
    "Four cards. One pattern. Let me show you what they're already saying."
  ],
  "patterns": [
    {
      "id": "unfinished_chapter",
      "label": "The Unfinished Chapter",
      "description": "You live in {his} story as a sentence that never got its full stop. Your answers suggest the bond didn't end so much as go quiet — and quiet, on {his} side, often marks something still being turned over, not something put down. The cards read what may be keeping that chapter open from {his} end."
    },
    {
      "id": "story_rewrote",
      "label": "The Story {He} Rewrote",
      "description": "You live in {his} story as a character {he} edited after the fact. Your answers carry the weight of a version you've heard second-hand and never been allowed to answer. The cards don't confirm or deny {his} version — they read what that rewriting is protecting in {him}."
    },
    {
      "id": "name_avoids",
      "label": "The Name {He} Avoids",
      "description": "You live in {his} story as a silence. Your answers suggest {he} goes around you rather than through you — and avoidance, in the cards, often marks weight, not absence. The cards read what {his} silence is carrying."
    },
    {
      "id": "quiet_comparison",
      "label": "The Quiet Comparison",
      "description": "You live in {his} story as a measure. Your answers suggest you've become the thing someone new is quietly held against — in {his} mind, or in yours. The cards read which of you is actually doing the comparing, and what it protects."
    }
  ],
  "cards": [
    {
      "number": 18,
      "name": "The Twilight",
      "interpretation": "The Twilight speaks to what is felt but not said — the version of events that lives under the version that gets told. Drawn here, it often marks a bond where {his} public story and {his} private one don't match.",
      "patternLine": "For {pattern}, this card suggests the story you've heard is the daylight version. The reading goes into the twilight one."
    },
    {
      "number": 8,
      "name": "Themis",
      "interpretation": "Themis is the arcanum of the scale — of accounts being settled and versions being weighed. It rarely speaks to who was right. It speaks to who is still weighing.",
      "patternLine": "For {pattern}, Themis suggests the case isn't closed on {his} side either. Someone is still holding the scale, and it may not be you."
    },
    {
      "number": 9,
      "name": "The Veiled Lamp",
      "interpretation": "The Veiled Lamp is light carried but hidden — the card of withdrawal, of turning inward, of a person who goes quiet because looking directly would cost too much. Silence, under this card, is rarely emptiness.",
      "patternLine": "For {pattern}, this card can speak to what {his} silence is protecting — and why {he} might go around your name rather than through it."
    },
    {
      "number": 20,
      "name": "The Awakening",
      "interpretation": "The Awakening is the arcanum of what rises again when it was supposed to stay buried — a name, a memory, a comparison that surfaces uninvited. It suggests something in the bond hasn't finished stirring.",
      "patternLine": "For {pattern}, The Awakening suggests you surface in {his} story more than {he} would choose — and the reading names what calls you back up."
    }
  ],
  "openLoop": {
    "surfaceLine": "That's the surface of your pattern — the part the cards show anyone who sits down. It is not the part that answers your 2 a.m. question.",
    "card2": "Underneath it sits a layer the cards only open in a full reading: what your role in {his} story is protecting in {him} — the reason the version {he} tells is shaped the way it is.",
    "card3": "And beneath that, the layer people actually come for: what the bond looks like from {his} side right now, read in the cards' own language — not as fact, not as surveillance, but as the shape of how you still live in {his} story.",
    "cta": "Open the full reading"
  },
  "lp": {
    "headline": "Read the Story {He} Tells About You — From {His} Side of the Bond",
    "subheadline": "A personalized Egyptian tarot reading of how you live in {his} story now. Written for you, ready in minutes, no guessing required.",
    "connection": [
      "You've built {his} version of you out of scraps — a friend's comment, a mutual's silence, a message that wasn't meant for your eyes. You probably know that version better than {he} has ever heard yours. And you've never once been allowed to answer it.",
      "Everyone around you has moved on from your breakup faster than you have. They don't want to hear the 2 a.m. question again. So you stopped asking it out loud and started asking it to your ceiling.",
      "You've tried the obvious things. Checking. Not checking. Blocking. Unblocking. A friend who says 'forget {him}.' None of it answered the actual question: how do you live in the story {he} tells, now that you're gone?"
    ],
    "comparison": [
      {
        "criterion": "The 2 a.m. question",
        "without": "Asked to the ceiling, unanswered",
        "with": "Read in the cards, in writing, tonight"
      },
      {
        "criterion": "{His} version of you",
        "without": "Pieced together from scraps",
        "with": "Read from the bond's other side, in the cards' language"
      },
      {
        "criterion": "The story you tell yourself",
        "without": "Rewritten every night, worse each time",
        "with": "Named as a pattern you can finally see"
      },
      {
        "criterion": "Who you talk to about it",
        "without": "Friends who are tired of hearing it",
        "with": "A Spiritual Guide available 24/7, never tired"
      },
      {
        "criterion": "Where you live in this",
        "without": "Inside {his} story, on {his} terms",
        "with": "Outside it, with your own reading in hand"
      }
    ],
    "authority": "AstroTarot has delivered 120,000+ personalized written readings, rated 4.9 by the people who received them. Every reading is built from your own answers and drawn from the Egyptian major arcana — written for you, not pulled from a template. We don't read {his} messages and we don't claim to know facts about {him}. We read the bond, from both sides, in the language the cards have always used.",
    "value": [
      {
        "benefit": "Finally read the story {he} tells — from {his} side of the bond",
        "feature": "Your full 'See What Your Ex Says About You' reading, written and personalized to your pattern"
      },
      {
        "benefit": "Ask the next question the moment it surfaces — and the one after that",
        "feature": "Unlimited personalized readings on any bond, any question, any time"
      },
      {
        "benefit": "Never sit alone with the 2 a.m. question again",
        "feature": "Spiritual Guide available 24/7 to talk through what the cards opened"
      },
      {
        "benefit": "Stop rereading {his} version — keep yours",
        "feature": "Every reading saved to your account, to return to on the hard nights"
      },
      {
        "benefit": "Read the bond again as it changes — because it will",
        "feature": "Re-draw on the same connection whenever something shifts"
      }
    ],
    "priceLine": "Unlimited: $9.99/month · $39.99 for 6 months · $59.99 for a full year — every reading, every question, the Guide included.",
    "guarantee": "7 days, no conditions. Open the reading, sit with it, talk to the Guide. If it didn't give you something the ceiling couldn't, email us inside 7 days and we refund it. You don't have to explain.",
    "faq": [
      {
        "q": "How could you possibly know what {he} says about me?",
        "a": "We can't — and anyone who tells you they can is lying to you. We don't read {his} messages, we don't watch {his} profile, and we don't know facts about {him}. What the cards do is read the bond from both sides: the pattern of how you live in {his} story, what that story protects, what {his} silence tends to carry. It's interpretive, it's honest about being interpretive, and for the questions you're actually carrying, that's what tends to help."
      },
      {
        "q": "Will this tell me if {he}'s coming back?",
        "a": "No, and we won't pretend to. The reading doesn't promise reconciliation, predict {his} next move, or tell you to wait. It reads the bond as it stands — including the parts of it that live on {his} side — so you can stop living inside {his} version and decide from your own."
      },
      {
        "q": "I've already had a reading somewhere else. How is this different?",
        "a": "The usual 'ex' reading reads you and your feelings. This one is built around the other side of the bond — how you exist in the story {he} tells — and it's written personally from your own answers, not generated from a generic spread. And you don't get one reading; you get unlimited, plus a Guide to talk them through."
      },
      {
        "q": "Why a subscription instead of one reading?",
        "a": "Because the 2 a.m. question never comes alone. Tonight it's what {he} says. Next week it's why {he} went quiet. After that, it's someone new. Unlimited means you ask each one as it arrives, for one flat monthly price — and you can cancel any time, with 7 days to change your mind."
      }
    ],
    "ctaB": "Stop reading {his} version from the outside. [Open my full reading] Unlimited readings · Spiritual Guide 24/7 · 7-day money-back guarantee"
  }
};
