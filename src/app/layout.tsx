import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AstroTarot Hub — Tarot & Astrology",
  description:
    "Personalized tarot readings integrated with detailed birth charts to illuminate your path.",
};

// Clerk appearance aligned with the dark mystic theme (purple/gold).
// Every text color is set EXPLICITLY — never rely on the base theme alone,
// or inputs/labels/footer fall back to near-black on the dark background.
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#d4af37",
    colorTextOnPrimaryBackground: "#1a1330",
    colorBackground: "#161027",
    colorInputBackground: "rgba(255,255,255,0.06)",
    colorText: "#e8e4f5",
    colorTextSecondary: "#b7abdd",
    colorInputText: "#e8e4f5",
    colorNeutral: "#e8e4f5",
    colorDanger: "#f87171",
    colorSuccess: "#4ade80",
    colorWarning: "#facc15",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "glass glass-gold shadow-glass",
    headerTitle: "text-gold font-display",
    headerSubtitle: "text-[#b7abdd]",
    socialButtonsBlockButton:
      "border border-white/15 bg-white/5 text-[#e8e4f5] hover:bg-white/10",
    socialButtonsBlockButtonText: "text-[#e8e4f5]",
    dividerLine: "bg-white/15",
    dividerText: "text-[#b7abdd]",
    formFieldLabel: "text-[#e8e4f5]",
    formFieldInput:
      "bg-white/5 border-white/15 text-[#e8e4f5] placeholder:text-[#8d80b8]",
    formFieldInputShowPasswordButton: "text-[#b7abdd] hover:text-[#e8e4f5]",
    otpCodeFieldInput: "bg-white/5 border-white/15 text-[#e8e4f5]",
    formButtonPrimary: "btn-gold",
    footer: "bg-transparent",
    footerActionText: "text-[#b7abdd]",
    footerActionLink: "text-[#d4af37] hover:text-[#edd9a3]",
    formResendCodeLink: "text-[#d4af37]",
    identityPreviewText: "text-[#e8e4f5]",
    identityPreviewEditButton: "text-[#d4af37]",
    alertText: "text-[#e8e4f5]",
    formFieldErrorText: "text-[#f87171]",
  },
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/auth/login"
      signUpUrl="/auth/register"
      afterSignOutUrl="/"
    >
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* Meta Pixel */}
        {META_PIXEL_ID && (
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
    </ClerkProvider>
  );
}
