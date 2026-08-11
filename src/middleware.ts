import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Rotas que exigem login. /tarot, /compatibility, /numerology e /predictions
// viraram landing pages públicas (SEO) — a ferramenta em si continua gated:
// a UI autenticada só renderiza com sessão e as APIs respondem 401 sem auth.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/cart(.*)",
  "/personality(.*)",
  "/abundance(.*)",
  "/guia(.*)",
  "/profile(.*)",
  // /admin exige login aqui; a autorização por e-mail é checada na página
  // (isAdmin), que responde 404 para quem não está na allowlist.
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Consolidação canônica: www → non-www (308 permanente, preserva path/query).
  // Restrito ao host exato de produção — não afeta quiz.* nem *.vercel.app.
  const host = req.headers.get("host") ?? "";
  if (host === "www.astrotarot.shop") {
    const url = req.nextUrl.clone();
    url.host = "astrotarot.shop";
    return NextResponse.redirect(url, 308);
  }

  // Subdomínio do funil: quiz.astrotarot.shop/* → reescreve para /quiz/*.
  // Fica ANTES da lógica de proteção — o funil é 100% público.
  if (host === "quiz.astrotarot.shop" || host.startsWith("quiz.")) {
    const p = req.nextUrl.pathname;
    if (
      !p.startsWith("/quiz") &&
      !p.startsWith("/api") &&
      !p.startsWith("/_next") &&
      !p.includes(".")
    ) {
      const url = req.nextUrl.clone();
      url.pathname = p === "/" ? "/quiz" : "/quiz" + p;
      return NextResponse.rewrite(url);
    }
  }

  const { userId, redirectToSignIn } = await auth();

  // Já logado tentando acessar login/cadastro → manda pro dashboard.
  const path = req.nextUrl.pathname;
  if (userId && (path === "/auth/login" || path === "/auth/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Rota protegida sem sessão → tela de login do Clerk.
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }
});

export const config = {
  matcher: [
    // Ignora arquivos estáticos e _next; roda nas demais rotas e nas de API.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|glb|woff2?|ttf)).*)",
    "/(api|trpc)(.*)",
  ],
};
