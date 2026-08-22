"use client";

// Substitui os seis cards grandes de features que dividiam a atenção da
// home com o tarot e o retrato.
//
// Some-los de vez custaria caro: /predictions, /numerology, /personality,
// /abundance e /compatibility são páginas indexadas, e sem link da home
// virariam órfãs. A faixa mantém o link interno num tamanho que não
// compete com os dois produtos.

import { motion } from "framer-motion";
import Link from "next/link";
import { Sun, Orbit, Hash, Sparkles, Moon, Hourglass } from "lucide-react";

const EXTRAS = [
  { icon: Sparkles, label: "Personal rituals", href: "/rituals" },
  { icon: Moon, label: "Dream interpretation", href: "/dreams" },
  { icon: Hourglass, label: "Past lives", href: "/past-lives" },
  { icon: Sun, label: "Daily horoscope", href: "/predictions" },
  { icon: Orbit, label: "Birth chart", href: "/personality" },
  { icon: Hash, label: "Lucky numbers", href: "/numerology" },
];

export default function AlsoIncluded() {
  return (
    <section className="relative px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-sm font-semibold uppercase tracking-wider text-ink-600"
        >
          Also in your Premium
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {EXTRAS.map(({ icon: Icon, label, href }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <Link
                href={href}
                className="glass flex items-center gap-2.5 rounded-full border-white/5 px-5 py-3 text-sm text-ink-200 transition-colors hover:border-gold-400/30 hover:text-gold-200"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-gold-400" />
                {label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
