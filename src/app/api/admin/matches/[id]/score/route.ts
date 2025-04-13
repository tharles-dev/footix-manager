import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { invalidateCache } from "@/lib/cache";
import { ApiError } from "@/lib/errors";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar rate limit
    const rateLimit = await checkRateLimit(request, 5, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    // Obter dados da requisição
    const { home_goals, away_goals, match_stats } = await request.json();

    // Validar dados
    if (typeof home_goals !== "number" || typeof away_goals !== "number") {
      throw new ApiError("INVALID_DATA", "Placar inválido");
    }

    if (home_goals < 0 || away_goals < 0) {
      throw new ApiError("INVALID_DATA", "Placar não pode ser negativo");
    }

    // Criar cliente Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Buscar partida
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        `
        *,
        competition:competitions (
          id,
          type,
          points_win,
          points_draw,
          server_id
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (matchError || !match) {
      throw new ApiError("MATCH_NOT_FOUND", "Partida não encontrada");
    }

    // Verificar se a partida já está concluída
    if (match.status === "completed") {
      throw new ApiError(
        "MATCH_ALREADY_COMPLETED",
        "Partida já está concluída"
      );
    }

    // Iniciar transação
    const { error: transactionError } = await supabase.rpc(
      "process_match_score",
      {
        p_match_id: params.id,
        p_home_goals: home_goals,
        p_away_goals: away_goals,
        p_match_stats: match_stats,
      }
    );

    if (transactionError) {
      throw new ApiError("MATCH_UPDATE_FAILED", "Erro ao processar pontuação");
    }

    // Invalidar cache
    await invalidateCache(`match:${params.id}`);
    await invalidateCache(`competition:${match.competition_id}:standings`);

    return NextResponse.json({
      message: "Pontuação registrada com sucesso",
      data: {
        match_id: params.id,
        home_goals,
        away_goals,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
