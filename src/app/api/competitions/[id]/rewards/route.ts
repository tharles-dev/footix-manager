import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";

// GET /api/competitions/[id]/rewards
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("competition-rewards", 30, 60); // 30 requisições por minuto

    // Verifica se a competição existe
    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .select(
        `
        id,
        name,
        type,
        season,
        reward_schema
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
        logo_url
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
        goal_difference: club.goals_for - club.goals_against,
        matches_played: club.wins + club.draws + club.losses,
      };
    });

    // Ordena a classificação por pontos
    const sortedStandings = [...standings].sort((a, b) => b.points - a.points);

    // Busca jogadores para artilheiros e assistências
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select(
        `
        id,
        home_goals,
        away_goals,
        home_lineup,
        away_lineup,
        match_stats
      `
      )
      .eq("competition_id", params.id)
      .eq("status", "completed");

    if (matchesError) {
      throw new ApiError({
        message: "Erro ao buscar partidas da competição",
        code: "MATCHES_FETCH_FAILED",
        details: matchesError,
      });
    }

    // Processa estatísticas de jogadores
    const playerStats: Record<string, { goals: number; assists: number }> = {};

    matches.forEach((match) => {
      if (match.match_stats && match.match_stats.players) {
        Object.entries(match.match_stats.players).forEach(
          ([playerId, stats]: [string, any]) => {
            if (!playerStats[playerId]) {
              playerStats[playerId] = { goals: 0, assists: 0 };
            }

            playerStats[playerId].goals += stats.goals || 0;
            playerStats[playerId].assists += stats.assists || 0;
          }
        );
      }
    });

    // Busca detalhes dos jogadores
    const playerIds = Object.keys(playerStats);
    const { data: players, error: playersError } = await supabase
      .from("server_players")
      .select(
        `
        id,
        name,
        club_id
      `
      )
      .in("id", playerIds);

    if (playersError) {
      throw new ApiError({
        message: "Erro ao buscar detalhes dos jogadores",
        code: "PLAYERS_FETCH_FAILED",
        details: playersError,
      });
    }

    // Combina estatísticas com detalhes dos jogadores
    const playerRankings = players.map((player) => {
      const stats = playerStats[player.id];
      const club = clubDetails.find((c) => c.id === player.club_id);

      return {
        id: player.id,
        name: player.name,
        club_id: player.club_id,
        club_name: club?.name || "Clube Desconhecido",
        club_logo: club?.logo_url,
        goals: stats.goals,
        assists: stats.assists,
      };
    });

    // Ordena jogadores por gols e assistências
    const topScorers = [...playerRankings]
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);

    const topAssisters = [...playerRankings]
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 10);

    // Prepara o esquema de premiações
    const rewardSchema = competition.reward_schema || {
      positions: {
        1: 5000000,
        2: 3000000,
        3: 2000000,
        4: 1000000,
      },
      top_scorer: 1000000,
      top_assister: 500000,
    };

    return NextResponse.json({
      data: {
        competition: {
          id: competition.id,
          name: competition.name,
          type: competition.type,
          season: competition.season,
        },
        rewards: {
          schema: rewardSchema,
          positions: sortedStandings.slice(0, 4).map((club, index) => ({
            position: index + 1,
            club_id: club.club_id,
            club_name: club.club_name,
            club_logo: club.club_logo,
            points: club.points,
            reward: rewardSchema.positions[index + 1] || 0,
          })),
          top_scorers: topScorers.map((player, index) => ({
            position: index + 1,
            player_id: player.id,
            player_name: player.name,
            club_id: player.club_id,
            club_name: player.club_name,
            club_logo: player.club_logo,
            goals: player.goals,
            reward: index === 0 ? rewardSchema.top_scorer : 0,
          })),
          top_assisters: topAssisters.map((player, index) => ({
            position: index + 1,
            player_id: player.id,
            player_name: player.name,
            club_id: player.club_id,
            club_name: player.club_name,
            club_logo: player.club_logo,
            assists: player.assists,
            reward: index === 0 ? rewardSchema.top_assister : 0,
          })),
        },
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar premiações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
