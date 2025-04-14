import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(
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
      .select("*")
      .eq("id", serverId)
      .single();

    if (serverError || !server) {
      return NextResponse.json(
        { error: "Servidor não encontrado", message: "Servidor não existe" },
        { status: 404 }
      );
    }

    // Verificar se o servidor está em andamento
    if (server.status !== "andamento") {
      return NextResponse.json(
        {
          error: "Operação inválida",
          message:
            "Apenas servidores em andamento podem ter a temporada finalizada",
        },
        { status: 400 }
      );
    }

    // Iniciar transação para finalizar a temporada
    const { error: transactionError } = await supabase.rpc("close_season", {
      p_server_id: serverId,
    });

    if (transactionError) {
      console.error("Erro ao finalizar temporada:", transactionError);
      return NextResponse.json(
        { error: "Erro interno", message: "Falha ao finalizar temporada" },
        { status: 500 }
      );
    }

    // Atualizar o status do servidor para "finalizada"
    const { error: updateError } = await supabase
      .from("servers")
      .update({
        status: "finalizada",
        updated_at: new Date().toISOString(),
      })
      .eq("id", serverId);

    if (updateError) {
      console.error("Erro ao atualizar status do servidor:", updateError);
      return NextResponse.json(
        {
          error: "Erro interno",
          message: "Falha ao atualizar status do servidor",
        },
        { status: 500 }
      );
    }

    // Registrar log administrativo
    const { error: logError } = await supabase.from("admin_logs").insert({
      server_id: serverId,
      type: "season_close",
      message: `Temporada ${server.season} finalizada`,
      metadata: {
        previous_season: server.season,
        closed_at: new Date().toISOString(),
      },
    });

    if (logError) {
      console.error("Erro ao registrar log:", logError);
      // Não retornamos erro aqui, pois a operação principal já foi concluída
    }

    return NextResponse.json(
      {
        message: "Temporada finalizada com sucesso",
        data: {
          server_id: serverId,
          previous_season: server.season,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno", message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
