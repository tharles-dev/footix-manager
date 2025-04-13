import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

// Schema para validação de criação de partida
const createMatchSchema = z.object({
  competition_id: z.string().uuid(),
  home_club_id: z.string().uuid(),
  away_club_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
  round: z.number().int().positive(),
});

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

// GET /api/admin/matches
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("admin-matches-list", 30, 60); // 30 requisições por minuto

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
        message: "Acesso negado. Apenas administradores podem listar partidas.",
        code: "FORBIDDEN",
      });
    }

    // Obtém parâmetros de consulta
    const url = new URL(request.url);
    const competitionId = url.searchParams.get("competition_id");
    const status = url.searchParams.get("status");
    const round = url.searchParams.get("round");

    // Constrói a consulta
    let query = supabase
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
          season
        ),
        home_club:clubs!home_club_id (
          id,
          name,
          logo_url
        ),
        away_club:clubs!away_club_id (
          id,
          name,
          logo_url
        )
      `
      )
      .order("scheduled_at", { ascending: true });

    // Aplica filtros
    if (competitionId) {
      query = query.eq("competition_id", competitionId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (round) {
      query = query.eq("round", parseInt(round));
    }

    // Executa a consulta
    const { data: matches, error } = await query;

    if (error) {
      throw new ApiError({
        message: "Erro ao buscar partidas",
        code: "MATCHES_FETCH_FAILED",
        details: error,
      });
    }

    return NextResponse.json({
      data: {
        matches,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao listar partidas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("admin-matches-create", 5, 60); // 5 requisições por minuto

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
        message: "Acesso negado. Apenas administradores podem criar partidas.",
        code: "FORBIDDEN",
      });
    }

    // Valida e processa o payload
    const payload = await request.json();
    const validatedData = createMatchSchema.parse(payload);

    // Verifica se a competição existe
    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .select("id, server_id, season")
      .eq("id", validatedData.competition_id)
      .single();

    if (competitionError || !competition) {
      throw new ApiError({
        message: "Competição não encontrada",
        code: "COMPETITION_NOT_FOUND",
      });
    }

    // Verifica se os clubes existem e pertencem ao servidor da competição
    const { data: clubs, error: clubsError } = await supabase
      .from("clubs")
      .select("id, server_id")
      .in("id", [validatedData.home_club_id, validatedData.away_club_id]);

    if (clubsError || !clubs || clubs.length !== 2) {
      throw new ApiError({
        message: "Um ou mais clubes não foram encontrados",
        code: "CLUBS_NOT_FOUND",
      });
    }

    // Verifica se os clubes pertencem ao servidor da competição
    const invalidClubs = clubs.filter(
      (club) => club.server_id !== competition.server_id
    );
    if (invalidClubs.length > 0) {
      throw new ApiError({
        message: "Um ou mais clubes não pertencem ao servidor da competição",
        code: "INVALID_CLUB_SERVER",
      });
    }

    // Verifica se os clubes participam da competição
    const { data: competitionClubs, error: competitionClubsError } =
      await supabase
        .from("competition_clubs")
        .select("club_id")
        .eq("competition_id", validatedData.competition_id)
        .in("club_id", [
          validatedData.home_club_id,
          validatedData.away_club_id,
        ]);

    if (
      competitionClubsError ||
      !competitionClubs ||
      competitionClubs.length !== 2
    ) {
      throw new ApiError({
        message: "Um ou mais clubes não participam da competição",
        code: "CLUBS_NOT_IN_COMPETITION",
      });
    }

    // Verifica se já existe uma partida entre os mesmos clubes na mesma rodada
    const { data: existingMatch, error: existingMatchError } = await supabase
      .from("matches")
      .select("id")
      .eq("competition_id", validatedData.competition_id)
      .eq("round", validatedData.round)
      .or(
        `and(home_club_id.eq.${validatedData.home_club_id},away_club_id.eq.${validatedData.away_club_id}),and(home_club_id.eq.${validatedData.away_club_id},away_club_id.eq.${validatedData.home_club_id})`
      )
      .single();

    if (existingMatchError && existingMatchError.code !== "PGRST116") {
      throw new ApiError({
        message: "Erro ao verificar partida existente",
        code: "MATCH_CHECK_FAILED",
        details: existingMatchError,
      });
    }

    if (existingMatch) {
      throw new ApiError({
        message: "Já existe uma partida entre estes clubes nesta rodada",
        code: "MATCH_ALREADY_EXISTS",
      });
    }

    // Cria a partida
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        competition_id: validatedData.competition_id,
        home_club_id: validatedData.home_club_id,
        away_club_id: validatedData.away_club_id,
        scheduled_at: validatedData.scheduled_at,
        status: "scheduled",
        round: validatedData.round,
      })
      .select()
      .single();

    if (matchError) {
      throw new ApiError({
        message: "Erro ao criar partida",
        code: "MATCH_CREATE_FAILED",
        details: matchError,
      });
    }

    // Registra log administrativo
    await supabase.from("admin_logs").insert({
      server_id: competition.server_id,
      type: "match_created",
      message: `Partida criada: ${validatedData.home_club_id} vs ${validatedData.away_club_id} (Rodada ${validatedData.round})`,
      metadata: {
        match_id: match.id,
        competition_id: validatedData.competition_id,
        home_club_id: validatedData.home_club_id,
        away_club_id: validatedData.away_club_id,
        round: validatedData.round,
      },
    });

    return NextResponse.json({
      message: "Partida criada com sucesso",
      data: {
        match,
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

    console.error("Erro ao criar partida:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/matches
export async function PUT(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("admin-matches-update", 5, 60); // 5 requisições por minuto

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

    // Obtém parâmetros de consulta
    const url = new URL(request.url);
    const matchId = url.searchParams.get("id");

    if (!matchId) {
      throw new ApiError({
        message: "ID da partida não fornecido",
        code: "MATCH_ID_REQUIRED",
      });
    }

    // Verifica se a partida existe
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, competition_id, status")
      .eq("id", matchId)
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
      .eq("id", matchId)
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
      // Obtém os clubes da partida
      const { data: matchDetails } = await supabase
        .from("matches")
        .select("home_club_id, away_club_id")
        .eq("id", matchId)
        .single();

      if (matchDetails) {
        // Atualiza a classificação do clube da casa
        await updateClubStanding(
          supabase,
          match.competition_id,
          matchDetails.home_club_id,
          validatedData.home_goals,
          validatedData.away_goals
        );

        // Atualiza a classificação do clube visitante
        await updateClubStanding(
          supabase,
          match.competition_id,
          matchDetails.away_club_id,
          validatedData.away_goals,
          validatedData.home_goals
        );
      }
    }

    // Registra log administrativo
    await supabase.from("admin_logs").insert({
      server_id: match.competition_id, // Usando competition_id como server_id para simplificar
      type: "match_updated",
      message: `Partida atualizada: ${matchId} (Status: ${validatedData.status})`,
      metadata: {
        match_id: matchId,
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
