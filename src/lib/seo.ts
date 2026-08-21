// Structured data (JSON-LD) generators — single source of truth for AEO/GEO.
// Rendered via src/components/JsonLd.tsx.

export const SITE_URL = "https://astrotarot.shop";
export const SITE_NAME = "AstroTarot Hub";

export interface FaqItem {
  question: string;
  answer: string;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/brand/astrotarot-logo.png`,
    },
    description:
      "AstroTarot Hub reads your real birth chart against the Egyptian Major Arcana to deliver personalized tarot readings, birth charts, compatibility, numerology and daily predictions.",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };
}

export function softwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#app`,
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any",
    inLanguage: "en",
    description:
      "Free personalized tarot readings, birth charts, love compatibility, numerology and daily predictions.",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "4 free tarot readings, Egyptian Tarot insights and Spiritual Guide.",
      },
      {
        "@type": "Offer",
        name: "Unlimited Readings — Monthly",
        price: "9.99",
        priceCurrency: "USD",
        description:
          "Unlimited personalized Egyptian Tarot readings and Spiritual Guide 24/7. Monthly subscription, cancel anytime.",
      },
      {
        "@type": "Offer",
        name: "Unlimited Readings — Annual",
        price: "59.99",
        priceCurrency: "USD",
        description:
          "Unlimited personalized Egyptian Tarot readings for a full year — about $4.99 a month.",
      },
    ],
  };
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
