import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Verificar sessão
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Atualizar sessão se existir (importante para manter o cookie vivo)
  if (session) {
    await supabase.auth.getUser();
  }

  // Rotas protegidas
  const protectedRoutes = [
    "/dashboard",
    "/tarot",
    "/cart",
    "/personality",
    "/compatibility",
    "/predictions",
    "/abundance",
    "/guia",
  ];

  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Se é rota protegida e não tem sessão, redirecionar para login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/auth/login", req.url);
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Se está logado e tenta acessar login/register, redirecionar para dashboard
  if (
    session &&
    (req.nextUrl.pathname === "/auth/login" ||
      req.nextUrl.pathname === "/auth/register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tarot/:path*",
    "/cart/:path*",
    "/personality/:path*",
    "/compatibility/:path*",
    "/predictions/:path*",
    "/abundance/:path*",
    "/guia/:path*",
    "/auth/:path*",
  ],
};
