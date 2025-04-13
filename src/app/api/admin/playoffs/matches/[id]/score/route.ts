import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar rate limit
    const userId = request.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await checkRateLimit(userId, 5, 60);

    // Obter dados da requisição
    const { home_goals, away_goals, match_stats } = await request.json();

    // Validar dados
    if (typeof home_goals !== "number" || typeof away_goals !== "number") {
      throw new ApiError({
        message: "Placar inválido",
        code: "INVALID_DATA",
      });
    }

    if (home_goals < 0 || away_goals < 0) {
      throw new ApiError({
        message: "Placar não pode ser negativo",
        code: "INVALID_DATA",
      });
    }

    // Criar cliente Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Buscar partida
    const { data: match, error: matchError } = await supabase
      .from("playoff_matches")
      .select(
        `
        *,
        playoff:playoffs (
          id,
          competition_id,
          season
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (matchError || !match) {
      throw new ApiError({
        message: "Partida não encontrada",
        code: "MATCH_NOT_FOUND",
      });
    }

    // Verificar se a partida já está concluída
    if (match.status === "completed") {
      throw new ApiError({
        message: "Partida já está concluída",
        code: "MATCH_ALREADY_COMPLETED",
      });
    }

    // Processar resultado
    const { error: processError } = await supabase.rpc(
      "process_playoff_match",
      {
        p_match_id: params.id,
        p_home_goals: home_goals,
        p_away_goals: away_goals,
        p_match_stats: match_stats,
      }
    );

    if (processError) {
      throw new ApiError({
        message: "Erro ao processar resultado",
        code: "MATCH_PROCESSING_FAILED",
      });
    }

    // Invalidar cache
    await invalidateCache(`playoff:${match.playoff_id}`);
    await invalidateCache(
      `competition:${match.playoff.competition_id}:playoffs`
    );

    return NextResponse.json({
      message: "Resultado processado com sucesso",
      data: {
        match_id: params.id,
        home_goals,
        away_goals,
        match_stats,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
