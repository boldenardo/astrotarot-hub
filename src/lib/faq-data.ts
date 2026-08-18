// Perguntas e respostas reais do produto — usadas na seção FAQ da home
// e no schema FAQPage (JSON-LD). Manter respostas diretas (2-3 frases):
// é o formato que motores de resposta (AI Overviews, ChatGPT, Perplexity) extraem.
import type { FaqItem } from "./seo";

export const HOME_FAQS: FaqItem[] = [
  {
    question: "What is AstroTarot Hub?",
    answer:
      "AstroTarot Hub is a tarot and astrology web app. It reads your real birth data against the Egyptian Major Arcana to build personalized tarot readings, birth charts, love compatibility, numerology and daily predictions.",
  },
  {
    question: "Is AstroTarot Hub free?",
    answer:
      "Yes. You get 4 free tarot readings, Egyptian Tarot insights and access to the Spiritual Guide without a credit card. A 5-Reading Pack ($9.99 one-time) and an Unlimited Premium plan ($14.99/month) unlock more readings and premium features.",
  },
  {
    question: "How does a personalized tarot reading work?",
    answer:
      "You pick cards from a shuffled Egyptian tarot deck, and each card is interpreted in the context of your question and your astrological profile. The result is a personalized reading about love, growth and decisions — not a generic card description.",
  },
  {
    question: "What is the free 4-card reading?",
    answer:
      "The 4-card reading is a free interactive reading on AstroTarot Hub. You pick 4 cards from the shuffled Egyptian deck, reveal the meaning of each one, and receive insights about your present moment. No sign-up is required for the card experience.",
  },
  {
    question: "What is a birth chart and what do I need to get mine?",
    answer:
      "A birth chart (natal chart) maps the positions of the planets at the exact moment and place you were born. On AstroTarot Hub you only need your birth date, time and city — the chart is calculated from real astronomical data and interpreted for you.",
  },
  {
    question: "How does the love compatibility reading work?",
    answer:
      "The compatibility reading compares two people's birth data — sun signs, moon signs and other chart factors — to describe emotional, romantic and communication dynamics between the pair. You enter both birth dates and receive a personalized synastry analysis.",
  },
  {
    question: "What is a life path number in numerology?",
    answer:
      "Your life path number is calculated from your full birth date and is considered the core number in numerology — it describes your natural tendencies, strengths and life direction. AstroTarot Hub calculates it instantly and explains what it means for love, career and money.",
  },
  {
    question: "Is my personal data private?",
    answer:
      "Yes. Your birth data and readings are tied to your private account and are never shared or sold. Chats with the Spiritual Guide are confidential and available 24/7.",
  },
];
