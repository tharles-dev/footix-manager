import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
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

    // Buscar todos os servidores
    const { data: servers, error: serversError } = await supabase
      .from("servers")
      .select(
        `
        id,
        name,
        status,
        season,
        max_members,
        current_members,
        registration_deadline,
        season_length_days,
        entry_mode,
        registration_start,
        allow_free_agent_signing_outside_window,
        transfer_window_open,
        initial_budget,
        budget_growth_per_season,
        salary_cap,
        salary_cap_penalty_percentage,
        min_player_salary_percentage,
        max_player_salary_percentage,
        activate_clause,
        auto_clause_percentage,
        market_value_multiplier,
        enable_monetization,
        match_frequency_minutes,
        enable_auto_simulation,
        last_simulation,
        next_simulation,
        red_card_penalty,
        allow_penalty_waiver,
        players_source,
        admin_id,
        created_at,
        updated_at
      `
      )
      .order("created_at", { ascending: false });

    if (serversError) {
      console.error("Erro ao buscar servidores:", serversError);
      return NextResponse.json(
        { error: "Erro interno", message: "Falha ao buscar servidores" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: servers });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno", message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
