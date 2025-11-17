"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, ShoppingCart, User, LogIn } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-[9999] w-full"
    >
      <div className="relative bg-gradient-to-r from-purple-900/10 via-pink-900/10 to-purple-900/10 backdrop-blur-2xl border-b border-purple-500/20 shadow-2xl shadow-purple-500/10">
        {/* Liquid glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative z-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Star className="w-8 h-8 text-purple-400" fill="currentColor" />
              <div className="absolute inset-0 blur-md bg-purple-400/50 rounded-full" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
              AstroTarot
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink href="/challenge" active={pathname === "/challenge"}>
              Jogo Grátis
            </NavLink>
            <NavLink href="/tarot" active={pathname === "/tarot"}>
              Tarot
            </NavLink>
            <NavLink
              href="/compatibility"
              active={pathname === "/compatibility"}
            >
              Amor
            </NavLink>
            <NavLink href="/guia" active={pathname === "/guia"}>
              Guia
            </NavLink>
            <NavLink href="/predictions" active={pathname === "/predictions"}>
              Previsões
            </NavLink>
            <NavLink href="/abundance" active={pathname === "/abundance"}>
              Abundância
            </NavLink>
          </div>

          {/* Login and Cart */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-purple-500/30 transition-all hover:scale-105 group"
              title="Carrinho"
            >
              <ShoppingCart className="w-5 h-5 text-purple-300 group-hover:text-purple-200" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full text-xs font-bold flex items-center justify-center text-white border-2 border-black">
                0
              </span>
            </Link>

            {/* Login/Profile Button */}
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-500/50"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden md:inline">Entrar</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
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
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg backdrop-blur-sm ${
        active
          ? "text-white bg-purple-600/30 border border-purple-500/50"
          : "text-gray-300 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  );
}
