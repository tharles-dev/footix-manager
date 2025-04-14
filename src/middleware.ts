import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";

// Rotas que não requerem autenticação
const publicRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/verify",
  "/api/auth/google",
  "/api/auth/callback",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/verify",
  "/api/public",
  "/",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
];

// Verifica se a rota atual é pública
const isPublicRoute = (path: string) => {
  return publicRoutes.some((route) => path.startsWith(route));
};

export async function middleware(request: NextRequest) {
  const { response, supabase } = createClient(request);
  const path = request.nextUrl.pathname;

  // Se for uma rota pública, permite o acesso
  if (isPublicRoute(path)) {
    return response;
  }

  // Verifica se o usuário está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se não estiver autenticado, redireciona para login
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Busca o usuário na tabela users para obter o papel
  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Erro ao buscar papel do usuário:", error);
    // Em caso de erro, assume papel padrão
    return NextResponse.redirect(new URL("/web", request.url));
  }

  const role = userData?.role || "user";

  // Redireciona baseado no papel e na rota atual
  if (role === "admin") {
    // Se for admin e estiver tentando acessar rotas do web, redireciona para admin
    if (path.startsWith("/web")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  } else {
    // Se for user e estiver tentando acessar rotas do admin, redireciona para web
    if (path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/web", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
