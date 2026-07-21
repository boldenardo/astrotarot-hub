"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Moon,
  ShoppingBag,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

const LINKS = [
  { href: "/challenge", label: "Free Reading" },
  { href: "/tarot", label: "Tarot" },
  { href: "/compatibility", label: "Love" },
  { href: "/guia", label: "Guide" },
  { href: "/predictions", label: "Forecasts" },
  { href: "/numerology", label: "Numerology" },
  { href: "/abundance", label: "Prosperity" },
  { href: "/cart", label: "Plans" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="fixed inset-x-0 top-4 z-[9999] px-4">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto max-w-6xl"
      >
        <div
          className={`flex items-center justify-between gap-4 rounded-full border px-4 py-2.5 transition-all duration-300 ${
            scrolled
              ? "glass glass-gold shadow-glass"
              : "border-white/10 bg-night-900/40 backdrop-blur-xl"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5 pl-1">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-600 shadow-gold">
              <Moon className="h-5 w-5 text-night-900" strokeWidth={2.2} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink-50">
              Astro<span className="text-gold">Tarot</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                active={pathname === l.href}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              title="Plans"
              aria-label="Plans"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ink-200 transition-all hover:border-gold-400/50 hover:text-gold-300"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
            </Link>

            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="btn-gold hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm sm:flex"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <div className="hidden sm:flex">
                  <UserButton />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="btn-ghost hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm sm:flex"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-gold hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm sm:flex"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ink-100 transition-all hover:border-gold-400/50 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass glass-gold mt-2 overflow-hidden rounded-3xl p-2 lg:hidden"
            >
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === l.href
                      ? "bg-gold-400/10 text-gold-300"
                      : "text-ink-200 hover:bg-white/5 hover:text-ink-50"
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="btn-gold mt-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <div className="mt-2 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <UserButton />
                    <span className="text-sm text-ink-300">My account</span>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="btn-ghost mt-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="btn-gold mt-1 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign up
                  </Link>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-gold-400/10 text-gold-300"
          : "text-ink-200 hover:text-ink-50"
      }`}
    >
      {children}
    </Link>
  );
}
