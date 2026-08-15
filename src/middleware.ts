import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { LANG_COOKIE, localeFromAcceptLanguage } from "@/lib/i18n";

// Rotas que exigem login. /tarot, /compatibility, /numerology e /predictions
// viraram landing pages públicas (SEO) — a ferramenta em si continua gated:
// a UI autenticada só renderiza com sessão e as APIs respondem 401 sem auth.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/cart(.*)",
  "/personality(.*)",
  "/abundance(.*)",
  "/soulmate(.*)",
  "/vibes(.*)",
  "/guia(.*)",
  "/profile(.*)",
  // /admin exige login aqui; a autorização por e-mail é checada na página
  // (isAdmin), que responde 404 para quem não está na allowlist.
  "/admin(.*)",
]);

/**
 * O Clerk está realmente configurado?
 *
 * Com chave ausente ou de exemplo, o handshake do Clerk intercepta TODA
 * navegação e devolve JSON de erro no lugar da página — o funil inteiro
 * morre em silêncio, inclusive as rotas públicas que não precisam de
 * login nenhum. Vender não pode depender do login funcionar, então
 * quando não há chave real o middleware faz só os rewrites de host e
 * deixa as páginas renderizarem.
 *
 * Isso NÃO abre dados: as rotas de API continuam passando por
 * requireUser (plan-gate), que responde 401 sem sessão válida.
 */
function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  if (!pk || !sk) return false;
  if (sk.includes("placeholder")) return false;
  try {
    // A publishable key é o host da instância em base64, com "$" no fim.
    const host = Buffer.from(pk.replace(/^pk_(test|live)_/, ""), "base64")
      .toString("utf8")
      .replace(/\$$/, "");
    return host.length > 0 && !host.startsWith("example.");
  } catch {
    return false;
  }
}

/** Rewrites de host que valem com ou sem Clerk (www e subdomínio do funil). */
function hostRewrite(req: {
  headers: Headers;
  nextUrl: URL & { pathname: string; clone: () => URL };
}): NextResponse | null {
  // Consolidação canônica: www → non-www (308 permanente, preserva path/query).
  // Restrito ao host exato de produção — não afeta quiz.* nem *.vercel.app.
  const host = req.headers.get("host") ?? "";
  if (host === "www.astrotarot.shop") {
    const url = req.nextUrl.clone();
    url.host = "astrotarot.shop";
    return NextResponse.redirect(url, 308);
  }

  // Subdomínio do funil: quiz.astrotarot.shop/* → reescreve para /quiz/*.
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

  return null;
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  const rewritten = hostRewrite(req as never);
  if (rewritten) return rewritten;

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

/**
 * Grava o idioma detectado no cookie, para o SSR já renderizar traduzido.
 *
 * O Accept-Language chega em toda requisição (Safari e Chrome mandam), então
 * a primeira tela sai no idioma certo — sem flash de inglês, que é o que
 * mataria a conversão de quem fala espanhol.
 *
 * Só grava quando ainda não há cookie: assim uma escolha manual futura ou a
 * correção via navigator.language não é sobrescrita a cada navegação.
 */
function withLangCookie(req: NextRequest, res: NextResponse): NextResponse {
  if (req.cookies.get(LANG_COOKIE)) return res;
  const locale = localeFromAcceptLanguage(req.headers.get("accept-language"));
  res.cookies.set(LANG_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  // Sem Clerk real, o handshake dele quebraria até as páginas públicas.
  if (!isClerkConfigured()) {
    const res = hostRewrite(req as never) ?? NextResponse.next();
    return withLangCookie(req, res);
  }
  const result = clerkHandler(req, ev);
  // O handler do Clerk pode devolver Response ou Promise; só anexamos o
  // cookie quando temos um NextResponse em mãos.
  if (result instanceof Promise) {
    return result.then((res) =>
      res instanceof NextResponse ? withLangCookie(req, res) : res
    );
  }
  return result instanceof NextResponse ? withLangCookie(req, result) : result;
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos e _next; roda nas demais rotas e nas de API.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|glb|woff2?|ttf)).*)",
    "/(api|trpc)(.*)",
  ],
};
