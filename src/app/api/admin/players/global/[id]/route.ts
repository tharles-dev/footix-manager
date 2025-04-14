import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/error";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const cookieStore = cookies();
    // Criar cliente Supabase
    const supabase = createClient(cookieStore);

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário é administrador
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json(
        {
          error: "Acesso negado",
          message: "Usuário não tem permissão de administrador",
        },
        { status: 403 }
      );
    }

    // Buscar jogador global
    const { data, error } = await supabase
      .from("global_players")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Jogador global não encontrado" },
          { status: 404 }
        );
      }
      throw new ApiError({ message: error.message, code: error.code });
    }

    // Retornar resposta
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Erro ao buscar jogador global:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao buscar jogador global" },
      { status: 500 }
    );
  }
}
