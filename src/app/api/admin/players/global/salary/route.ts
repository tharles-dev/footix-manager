import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

// Schema para validação dos parâmetros
const updateSalarySchema = z.object({
  min_overall: z.number().min(0).max(99),
  max_overall: z.number().min(0).max(99),
  base_salary: z.number().positive(),
  market_value_multiplier: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    // Criar cliente Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

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

    // Obter e validar parâmetros
    const body = await request.json();
    const { min_overall, max_overall, base_salary, market_value_multiplier } =
      updateSalarySchema.parse(body);

    // Atualizar jogadores
    const { data, error } = await supabase
      .from("global_players")
      .update({
        base_salary,
        base_value: base_salary * (market_value_multiplier * 100),
      })
      .gte("overall", min_overall)
      .lte("overall", max_overall)
      .select();

    if (error) {
      throw new ApiError({ message: error.message, code: error.code });
    }

    // Retornar resposta
    return NextResponse.json({
      data: {
        updated_players: data.length,
        min_overall,
        max_overall,
        base_salary,
        market_value_multiplier,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar salários:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar salários" },
      { status: 500 }
    );
  }
}
