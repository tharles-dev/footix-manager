import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Fazer logout do usuário
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { message: error.message, code: "LOGOUT_ERROR" },
        { status: 500 }
      );
    }

    // Limpar cookies de autenticação
    const response = NextResponse.json(
      { message: "Logout realizado com sucesso" },
      { status: 200 }
    );

    // Definir cookies expirados
    response.cookies.set("sb-access-token", "", { expires: new Date(0) });
    response.cookies.set("sb-refresh-token", "", { expires: new Date(0) });

    return response;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
