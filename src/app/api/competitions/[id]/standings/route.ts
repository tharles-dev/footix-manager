import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";

// GET /api/competitions/[id]/standings
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("competition-standings", 30, 60); // 30 requisições por minuto

    // Verifica se a competição existe
    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .select(
        `
        id,
        name,
        type,
        season,
        points_win,
        points_draw,
        tie_break_order
      `
      )
      .eq("id", params.id)
      .single();

    if (competitionError || !competition) {
      throw new ApiError({
        message: "Competição não encontrada",
        code: "COMPETITION_NOT_FOUND",
      });
    }

    // Busca clubes participantes com dados de classificação
    const { data: clubs, error: clubsError } = await supabase
      .from("competition_clubs")
      .select(
        `
        club_id,
        group,
        points,
        goals_for,
        goals_against,
        wins,
        draws,
        losses
      `
      )
      .eq("competition_id", params.id);

    if (clubsError) {
      throw new ApiError({
        message: "Erro ao buscar clubes da competição",
        code: "CLUBS_FETCH_FAILED",
        details: clubsError,
      });
    }

    // Busca detalhes dos clubes
    const clubIds = clubs.map((club) => club.club_id);
    const { data: clubDetails, error: clubDetailsError } = await supabase
      .from("clubs")
      .select(
        `
        id,
        name,
        logo_url,
        city,
        country
      `
      )
      .in("id", clubIds);

    if (clubDetailsError) {
      throw new ApiError({
        message: "Erro ao buscar detalhes dos clubes",
        code: "CLUB_DETAILS_FETCH_FAILED",
        details: clubDetailsError,
      });
    }

    // Combina dados de classificação com detalhes dos clubes
    const standings = clubs.map((club) => {
      const details = clubDetails.find((detail) => detail.id === club.club_id);
      return {
        ...club,
        club_name: details?.name || "Clube Desconhecido",
        club_logo: details?.logo_url,
        club_city: details?.city,
        club_country: details?.country,
        goal_difference: club.goals_for - club.goals_against,
        matches_played: club.wins + club.draws + club.losses,
      };
    });

    // Ordena a classificação conforme critérios
    const sortedStandings = sortStandings(
      standings,
      competition.tie_break_order
    );

    return NextResponse.json({
      data: {
        competition: {
          id: competition.id,
          name: competition.name,
          type: competition.type,
          season: competition.season,
        },
        standings: sortedStandings,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar classificação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função para ordenar a classificação conforme critérios
function sortStandings(standings: any[], tieBreakOrder: string[]) {
  return [...standings].sort((a, b) => {
    // Primeiro critério: pontos
    if (a.points !== b.points) {
      return b.points - a.points;
    }

    // Aplica critérios de desempate na ordem especificada
    for (const criterion of tieBreakOrder) {
      switch (criterion) {
        case "goal_difference":
          if (a.goal_difference !== b.goal_difference) {
            return b.goal_difference - a.goal_difference;
          }
          break;
        case "goals_for":
          if (a.goals_for !== b.goals_for) {
            return b.goals_for - a.goals_for;
          }
          break;
        case "goals_against":
          if (a.goals_against !== b.goals_against) {
            return a.goals_against - b.goals_against;
          }
          break;
        case "wins":
          if (a.wins !== b.wins) {
            return b.wins - a.wins;
          }
          break;
        case "draws":
          if (a.draws !== b.draws) {
            return b.draws - a.draws;
          }
          break;
        case "losses":
          if (a.losses !== b.losses) {
            return a.losses - b.losses;
          }
          break;
        case "head_to_head":
          // Implementação de confronto direto seria adicionada aqui
          break;
      }
    }

    // Se todos os critérios forem iguais, mantém a ordem original
    return 0;
  });
}
