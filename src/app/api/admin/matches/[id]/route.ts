import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

// Schema para validação de atualização de partida
const updateMatchSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  home_goals: z.number().int().min(0).optional(),
  away_goals: z.number().int().min(0).optional(),
  home_formation: z.string().optional(),
  away_formation: z.string().optional(),
  home_lineup: z.record(z.string(), z.any()).optional(),
  away_lineup: z.record(z.string(), z.any()).optional(),
  match_stats: z.record(z.string(), z.any()).optional(),
  highlights: z.array(z.any()).optional(),
  events: z.array(z.any()).optional(),
});

interface PlayerMatchStats {
  red_cards: number;
}

// GET /api/admin/matches/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("admin-match-details", 30, 60); // 30 requisições por minuto

    // Verifica se o usuário é administrador
    const userId = request.headers.get("user-id");
    if (!userId) {
      throw new ApiError({
        message: "Usuário não autenticado",
        code: "UNAUTHORIZED",
      });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (!user || user.role !== "admin") {
      throw new ApiError({
        message:
          "Acesso negado. Apenas administradores podem ver detalhes de partidas.",
        code: "FORBIDDEN",
      });
    }

    // Busca a partida
    const { data: match, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        competition_id,
        home_club_id,
        away_club_id,
        scheduled_at,
        status,
        home_goals,
        away_goals,
        round,
        home_formation,
        away_formation,
        home_lineup,
        away_lineup,
        match_stats,
        highlights,
        events,
        competitions (
          id,
          name,
          type,
          season,
          server_id
        ),
        home_club:clubs!home_club_id (
          id,
          name,
          logo_url,
          city,
          country
        ),
        away_club:clubs!away_club_id (
          id,
          name,
          logo_url,
          city,
          country
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error) {
      throw new ApiError({
        message: "Partida não encontrada",
        code: "MATCH_NOT_FOUND",
        details: error,
      });
    }

    return NextResponse.json({
      data: {
        match,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar detalhes da partida:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/matches/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("admin-match-update", 5, 60); // 5 requisições por minuto

    // Verifica se o usuário é administrador
    const userId = request.headers.get("user-id");
    if (!userId) {
      throw new ApiError({
        message: "Usuário não autenticado",
        code: "UNAUTHORIZED",
      });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (!user || user.role !== "admin") {
      throw new ApiError({
        message:
          "Acesso negado. Apenas administradores podem atualizar partidas.",
        code: "FORBIDDEN",
      });
    }

    // Verifica se a partida existe
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, competition_id, status, home_club_id, away_club_id")
      .eq("id", params.id)
      .single();

    if (matchError || !match) {
      throw new ApiError({
        message: "Partida não encontrada",
        code: "MATCH_NOT_FOUND",
      });
    }

    // Valida e processa o payload
    const payload = await request.json();
    const validatedData = updateMatchSchema.parse(payload);

    // Atualiza a partida
    const { data: updatedMatch, error: updateError } = await supabase
      .from("matches")
      .update({
        status: validatedData.status,
        home_goals: validatedData.home_goals,
        away_goals: validatedData.away_goals,
        home_formation: validatedData.home_formation,
        away_formation: validatedData.away_formation,
        home_lineup: validatedData.home_lineup,
        away_lineup: validatedData.away_lineup,
        match_stats: validatedData.match_stats,
        highlights: validatedData.highlights,
        events: validatedData.events,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      throw new ApiError({
        message: "Erro ao atualizar partida",
        code: "MATCH_UPDATE_FAILED",
        details: updateError,
      });
    }

    // Se a partida foi concluída, atualiza a classificação
    if (
      match.status !== "completed" &&
      validatedData.status === "completed" &&
      validatedData.home_goals !== undefined &&
      validatedData.away_goals !== undefined
    ) {
      // Atualiza a classificação do clube da casa
      await updateClubStanding(
        supabase,
        match.competition_id,
        match.home_club_id,
        validatedData.home_goals,
        validatedData.away_goals
      );

      // Atualiza a classificação do clube visitante
      await updateClubStanding(
        supabase,
        match.competition_id,
        match.away_club_id,
        validatedData.away_goals,
        validatedData.home_goals
      );

      // Verifica cartões vermelhos e aplica multas se necessário
      await checkRedCards(supabase, match, validatedData);
    }

    // Registra log administrativo
    await supabase.from("admin_logs").insert({
      server_id: match.competition_id, // Usando competition_id como server_id para simplificar
      type: "match_updated",
      message: `Partida atualizada: ${params.id} (Status: ${validatedData.status})`,
      metadata: {
        match_id: params.id,
        competition_id: match.competition_id,
        status: validatedData.status,
      },
    });

    return NextResponse.json({
      message: "Partida atualizada com sucesso",
      data: {
        match: updatedMatch,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar partida:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/matches/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("admin-match-delete", 5, 60); // 5 requisições por minuto

    // Verifica se o usuário é administrador
    const userId = request.headers.get("user-id");
    if (!userId) {
      throw new ApiError({
        message: "Usuário não autenticado",
        code: "UNAUTHORIZED",
      });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (!user || user.role !== "admin") {
      throw new ApiError({
        message:
          "Acesso negado. Apenas administradores podem excluir partidas.",
        code: "FORBIDDEN",
      });
    }

    // Verifica se a partida existe
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, competition_id, status")
      .eq("id", params.id)
      .single();

    if (matchError || !match) {
      throw new ApiError({
        message: "Partida não encontrada",
        code: "MATCH_NOT_FOUND",
      });
    }

    // Verifica se a partida já foi concluída
    if (match.status === "completed") {
      throw new ApiError({
        message: "Não é possível excluir uma partida já concluída",
        code: "MATCH_ALREADY_COMPLETED",
      });
    }

    // Exclui a partida
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      throw new ApiError({
        message: "Erro ao excluir partida",
        code: "MATCH_DELETE_FAILED",
        details: deleteError,
      });
    }

    // Registra log administrativo
    await supabase.from("admin_logs").insert({
      server_id: match.competition_id, // Usando competition_id como server_id para simplificar
      type: "match_deleted",
      message: `Partida excluída: ${params.id}`,
      metadata: {
        match_id: params.id,
        competition_id: match.competition_id,
      },
    });

    return NextResponse.json({
      message: "Partida excluída com sucesso",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao excluir partida:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função auxiliar para atualizar a classificação de um clube
async function updateClubStanding(
  supabase: any,
  competitionId: string,
  clubId: string,
  goalsFor: number,
  goalsAgainst: number
) {
  // Obtém a classificação atual do clube
  const { data: standing } = await supabase
    .from("competition_clubs")
    .select("points, goals_for, goals_against, wins, draws, losses")
    .eq("competition_id", competitionId)
    .eq("club_id", clubId)
    .single();

  if (standing) {
    // Calcula o resultado
    const isWin = goalsFor > goalsAgainst;
    const isDraw = goalsFor === goalsAgainst;
    const isLoss = goalsFor < goalsAgainst;

    // Obtém os pontos por vitória e empate da competição
    const { data: competition } = await supabase
      .from("competitions")
      .select("points_win, points_draw")
      .eq("id", competitionId)
      .single();

    // Calcula os novos valores
    const pointsToAdd = isWin
      ? competition.points_win
      : isDraw
      ? competition.points_draw
      : 0;

    const newPoints = standing.points + pointsToAdd;
    const newGoalsFor = standing.goals_for + goalsFor;
    const newGoalsAgainst = standing.goals_against + goalsAgainst;
    const newWins = standing.wins + (isWin ? 1 : 0);
    const newDraws = standing.draws + (isDraw ? 1 : 0);
    const newLosses = standing.losses + (isLoss ? 1 : 0);

    // Atualiza a classificação
    await supabase
      .from("competition_clubs")
      .update({
        points: newPoints,
        goals_for: newGoalsFor,
        goals_against: newGoalsAgainst,
        wins: newWins,
        draws: newDraws,
        losses: newLosses,
      })
      .eq("competition_id", competitionId)
      .eq("club_id", clubId);
  }
}

// Função auxiliar para verificar cartões vermelhos e aplicar multas
async function checkRedCards(supabase: any, match: any, matchData: any) {
  // Verifica se há estatísticas de jogadores
  if (!matchData.match_stats || !matchData.match_stats.players) {
    return;
  }

  // Obtém a penalidade por cartão vermelho da competição
  const { data: competition } = await supabase
    .from("competitions")
    .select("red_card_penalty")
    .eq("id", match.competition_id)
    .single();

  if (!competition) {
    return;
  }

  const redCardPenalty = competition.red_card_penalty;

  // Verifica cartões vermelhos para cada jogador
  for (const [playerId, stats] of Object.entries(
    matchData.match_stats.players as Record<string, PlayerMatchStats>
  )) {
    if (stats.red_cards && stats.red_cards > 0) {
      // Determina o clube do jogador
      const { data: player } = await supabase
        .from("server_players")
        .select("club_id")
        .eq("id", playerId)
        .single();

      if (player) {
        // Cria uma multa para o clube
        await supabase.from("penalties").insert({
          server_id: match.competition_id, // Usando competition_id como server_id para simplificar
          club_id: player.club_id,
          match_id: match.id,
          player_id: playerId,
          type: "red_card",
          amount: redCardPenalty * stats.red_cards,
          status: "pending",
          description: `${stats.red_cards} cartão(s) vermelho(s) na partida`,
        });
      }
    }
  }
}
