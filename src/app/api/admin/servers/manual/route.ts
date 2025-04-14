import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";

// Schema de validação para criação de servidor
const createServerSchema = z.object({
  name: z.string().min(3).max(50),
  max_members: z.number().int().min(2).max(64),
  initial_budget: z.number().min(1000000),
  budget_growth_per_season: z.number().min(0).max(1),
  salary_cap: z.number().min(1000000),
  salary_cap_penalty_percentage: z.number().min(0).max(1),
  min_player_salary_percentage: z.number().int().min(50).max(100),
  max_player_salary_percentage: z.number().int().min(100).max(200),
  activate_clause: z.boolean(),
  auto_clause_percentage: z.number().min(100).max(500),
  market_value_multiplier: z.number().min(1).max(100),
  enable_monetization: z.boolean(),
  match_frequency_minutes: z.number().int().min(60).max(1440),
  enable_auto_simulation: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
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

    if (userError || userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado", message: "Usuário não é administrador" },
        { status: 403 }
      );
    }

    // Obter e validar o corpo da requisição
    const body = await request.json();

    try {
      createServerSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Dados inválidos",
            message: "Dados de entrada inválidos",
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
    }

    // Criar o servidor
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .insert({
        name: body.name,
        status: "inscricao",
        season: 1,
        max_members: body.max_members,
        current_members: 0,
        season_length_days: 40,
        entry_mode: "public",
        registration_start: new Date().toISOString(),
        registration_deadline: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 dias
        transfer_window_open: false,
        initial_budget: body.initial_budget,
        budget_growth_per_season: body.budget_growth_per_season,
        salary_cap: body.salary_cap,
        salary_cap_penalty_percentage: body.salary_cap_penalty_percentage,
        min_player_salary_percentage: body.min_player_salary_percentage,
        max_player_salary_percentage: body.max_player_salary_percentage,
        activate_clause: body.activate_clause,
        auto_clause_percentage: body.auto_clause_percentage,
        market_value_multiplier: body.market_value_multiplier,
        enable_monetization: body.enable_monetization,
        match_frequency_minutes: body.match_frequency_minutes,
        enable_auto_simulation: body.enable_auto_simulation,
        admin_id: user.id,
      })
      .select()
      .single();

    if (serverError) {
      console.error("Erro ao criar servidor:", serverError);
      return NextResponse.json(
        { error: "Erro interno", message: "Falha ao criar servidor" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Servidor criado com sucesso",
        data: server,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno", message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
