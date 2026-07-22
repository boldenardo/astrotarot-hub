import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Rotas que exigem login (mesmo conjunto de antes).
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/tarot(.*)",
  "/cart(.*)",
  "/personality(.*)",
  "/compatibility(.*)",
  "/predictions(.*)",
  "/abundance(.*)",
  "/guia(.*)",
  "/numerology(.*)",
  "/profile(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
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
