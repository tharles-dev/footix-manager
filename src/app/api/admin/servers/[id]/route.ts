import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serverId = params.id;
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

    // Buscar detalhes do servidor
    const { data: server, error: serverError } = await supabase
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
        current_season_start,
        current_season_end,
        registration_start,
        transfer_window_open,
        transfer_window_start,
        transfer_window_end,
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
      .eq("id", serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json(
        { error: "Servidor não encontrado", message: "Servidor não existe" },
        { status: 404 }
      );
    }

    // Buscar estatísticas adicionais
    const { count: clubCount, error: clubCountError } = await supabase
      .from("clubs")
      .select("*", { count: "exact", head: true })
      .eq("server_id", serverId);

    if (clubCountError) {
      console.error("Erro ao contar clubes:", clubCountError);
    }

    // Buscar competições ativas
    const { data: competitions, error: competitionsError } = await supabase
      .from("competitions")
      .select("id, name, type, season")
      .eq("server_id", serverId)
      .eq("season", server.season);

    if (competitionsError) {
      console.error("Erro ao buscar competições:", competitionsError);
    }

    // Buscar logs recentes
    const { data: recentLogs, error: logsError } = await supabase
      .from("admin_logs")
      .select("id, type, message, created_at")
      .eq("server_id", serverId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (logsError) {
      console.error("Erro ao buscar logs recentes:", logsError);
    }

    return NextResponse.json({
      data: {
        server,
        stats: {
          club_count: clubCount || 0,
        },
        competitions: competitions || [],
        recent_logs: recentLogs || [],
      },
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno", message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serverId = params.id;
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

    // Verificar se o servidor existe
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id, status")
      .eq("id", serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json(
        { error: "Servidor não encontrado", message: "Servidor não existe" },
        { status: 404 }
      );
    }

    // Obter e validar o corpo da requisição
    const body = await request.json();

    // Campos que podem ser atualizados
    const updateableFields = [
      "name",
      "max_members",
      "season_length_days",
      "entry_mode",
      "registration_deadline",
      "transfer_window_open",
      "transfer_window_start",
      "transfer_window_end",
      "budget_growth_per_season",
      "salary_cap",
      "salary_cap_penalty_percentage",
      "min_player_salary_percentage",
      "max_player_salary_percentage",
      "activate_clause",
      "auto_clause_percentage",
      "market_value_multiplier",
      "enable_monetization",
      "match_frequency_minutes",
      "enable_auto_simulation",
      "red_card_penalty",
      "allow_penalty_waiver",
    ] as const;

    type UpdateableField = (typeof updateableFields)[number];
    type UpdateData = Partial<
      Record<UpdateableField, string | number | boolean>
    >;

    // Filtrar apenas campos atualizáveis
    const updateData: UpdateData = {};
    for (const field of updateableFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Atualizar o servidor
    const { data: updatedServer, error: updateError } = await supabase
      .from("servers")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", serverId)
      .select()
      .single();

    if (updateError) {
      console.error("Erro ao atualizar servidor:", updateError);
      return NextResponse.json(
        { error: "Erro interno", message: "Falha ao atualizar servidor" },
        { status: 500 }
      );
    }

    // Registrar log administrativo
    const { error: logError } = await supabase.from("admin_logs").insert({
      server_id: serverId,
      type: "server_update",
      message: "Configurações do servidor atualizadas",
      metadata: {
        updated_fields: Object.keys(updateData),
        updated_at: new Date().toISOString(),
      },
    });

    if (logError) {
      console.error("Erro ao registrar log:", logError);
      // Não retornamos erro aqui, pois a operação principal já foi concluída
    }

    return NextResponse.json({
      message: "Servidor atualizado com sucesso",
      data: updatedServer,
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno", message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serverId = params.id;
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

    // Verificar se o servidor existe
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id, name, status")
      .eq("id", serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json(
        { error: "Servidor não encontrado", message: "Servidor não existe" },
        { status: 404 }
      );
    }

    // Verificar se o servidor pode ser excluído (não em andamento)
    if (server.status === "andamento") {
      return NextResponse.json(
        {
          error: "Operação inválida",
          message: "Não é possível excluir um servidor em andamento",
        },
        { status: 400 }
      );
    }

    // Excluir o servidor
    const { error: deleteError } = await supabase
      .from("servers")
      .delete()
      .eq("id", serverId);

    if (deleteError) {
      console.error("Erro ao excluir servidor:", deleteError);
      return NextResponse.json(
        { error: "Erro interno", message: "Falha ao excluir servidor" },
        { status: 500 }
      );
    }

    // Registrar log administrativo
    const { error: logError } = await supabase.from("admin_logs").insert({
      type: "server_delete",
      message: `Servidor "${server.name}" excluído`,
      metadata: {
        server_id: serverId,
        server_name: server.name,
        deleted_at: new Date().toISOString(),
      },
    });

    if (logError) {
      console.error("Erro ao registrar log:", logError);
      // Não retornamos erro aqui, pois a operação principal já foi concluída
    }

    return NextResponse.json({
      message: "Servidor excluído com sucesso",
      data: { server_id: serverId },
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno", message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
