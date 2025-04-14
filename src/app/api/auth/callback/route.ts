import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Marca a rota como dinâmica
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log(code);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redireciona para a página apropriada baseada no papel do usuário
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Busca o papel do usuário na tabela users
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user?.id)
        .single();

      const role = userData?.role || "user";

      console.log(role);

      return NextResponse.redirect(
        new URL(role === "admin" ? "/dashboard" : "/web", requestUrl.origin)
      );
    }
  }

  // Se houver erro ou não houver código, redireciona para a página de login
  return NextResponse.redirect(new URL("/auth/login", requestUrl.origin));
}
