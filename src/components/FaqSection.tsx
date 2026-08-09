import JsonLd from "@/components/JsonLd";
import { faqJsonLd, type FaqItem } from "@/lib/seo";

// Seção FAQ estática (sempre presente no HTML pré-renderizado — essencial
// para SEO/AEO: crawlers e LLMs leem as respostas sem executar JS).
// Inclui o schema FAQPage correspondente.
export default function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  return (
    <section className="relative px-4 py-16 sm:px-6 sm:py-24">
      <JsonLd data={faqJsonLd(faqs)} />
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-12 text-center font-display text-3xl font-semibold text-ink-50 sm:text-4xl">
          Frequently asked questions
        </h2>
        <dl className="space-y-6">
          {faqs.map((f) => (
            <div key={f.question} className="glass rounded-3xl p-6 sm:p-8">
              <dt>
                <h3 className="font-display text-xl font-semibold text-gold-300">
                  {f.question}
                </h3>
              </dt>
              <dd className="mt-3 text-base leading-relaxed text-ink-200">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
