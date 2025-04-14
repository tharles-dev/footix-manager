import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";

// POST /api/club/[id]/players/evolution
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-players-evolution", 5, 60); // 5 requisições por minuto

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id, server_id")
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Busca configurações do servidor
    const { data: server } = await supabase
      .from("servers")
      .select("market_value_multiplier")
      .eq("id", club.server_id)
      .single();

    if (!server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    // Busca jogadores do clube
    const { data: players } = await supabase
      .from("server_players")
      .select(
        `
        id,
        name,
        position,
        overall,
        potential,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
        contract,
        morale,
        form,
        xp,
        level,
        is_star_player
      `
      )
      .eq("club_id", params.id)
      .not("is_on_loan", "eq", true);

    if (!players?.length) {
      throw new ApiError({
        message: "Clube não possui jogadores para evolução",
        code: "NO_PLAYERS_FOUND",
      });
    }

    // Busca estatísticas dos jogadores
    const { data: stats } = await supabase
      .from("player_stats")
      .select("player_id, matches_played, goals, assists, clean_sheets, rating")
      .in(
        "player_id",
        players.map((p) => p.id)
      );

    // Processa evolução de cada jogador
    const updatePromises = players.map(async (player) => {
      const playerStats = stats?.find((s) => s.player_id === player.id);

      // Calcula XP baseado em estatísticas
      let xpGained = 0;
      if (playerStats) {
        // XP por jogos
        xpGained += playerStats.matches_played * 100;

        // XP por gols
        xpGained += playerStats.goals * 200;

        // XP por assistências
        xpGained += playerStats.assists * 150;

        // XP por clean sheets (apenas para goleiros e zagueiros)
        if (["GK", "CB", "LB", "RB"].includes(player.position)) {
          xpGained += playerStats.clean_sheets * 300;
        }

        // XP por rating
        xpGained += Math.floor(playerStats.rating * 100);
      }

      // Bônus por moral e forma
      const moraleBonus = Math.floor((player.morale - 50) * 10);
      const formBonus = Math.floor((player.form - 50) * 10);
      xpGained += Math.max(0, moraleBonus + formBonus);

      // Bônus para jogadores estrela
      if (player.is_star_player) {
        xpGained = Math.floor(xpGained * 1.5);
      }

      // Atualiza XP e nível
      const newXp = player.xp + xpGained;
      const newLevel = Math.floor(newXp / 1000) + 1; // Cada nível requer 1000 XP

      // Calcula evolução de atributos
      const attributeIncrease = Math.floor((newLevel - player.level) * 2); // +2 por nível

      // Atualiza os atributos do jogador
      const updatedAttributes = {
        overall: Math.min(99, player.overall + attributeIncrease),
        potential: Math.min(99, player.potential + attributeIncrease),
        pace: Math.min(99, player.pace + attributeIncrease),
        shooting: Math.min(99, player.shooting + attributeIncrease),
        passing: Math.min(99, player.passing + attributeIncrease),
        dribbling: Math.min(99, player.dribbling + attributeIncrease),
        defending: Math.min(99, player.defending + attributeIncrease),
        physical: Math.min(99, player.physical + attributeIncrease),
      };

      // Atualiza os atributos do jogador
      const { error: updateError } = await supabase
        .from("server_players")
        .update({
          overall: updatedAttributes.overall,
          potential: updatedAttributes.potential,
          pace: updatedAttributes.pace,
          shooting: updatedAttributes.shooting,
          passing: updatedAttributes.passing,
          dribbling: updatedAttributes.dribbling,
          defending: updatedAttributes.defending,
          physical: updatedAttributes.physical,
          xp: 0,
          level: newLevel,
        })
        .eq("id", player.id);

      if (updateError) {
        throw new Error("Erro ao atualizar jogador");
      }

      // Retorna o jogador atualizado
      const updatedPlayer = {
        id: player.id,
        name: player.name,
        position: player.position,
        overall: updatedAttributes.overall,
        potential: updatedAttributes.potential,
        pace: updatedAttributes.pace,
        shooting: updatedAttributes.shooting,
        passing: updatedAttributes.passing,
        dribbling: updatedAttributes.dribbling,
        defending: updatedAttributes.defending,
        physical: updatedAttributes.physical,
        contract: player.contract,
        morale: player.morale,
        form: player.form,
        xp: 0,
        level: newLevel,
        is_star_player: player.is_star_player,
      };

      return updatedPlayer;
    });

    // Aguarda todas as atualizações
    const updatedPlayers = await Promise.all(updatePromises);

    // Atualiza jogadores no banco
    const { error: updateError } = await supabase.from("server_players").upsert(
      updatedPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        overall: p.overall,
        potential: p.potential,
        pace: p.pace,
        shooting: p.shooting,
        passing: p.passing,
        dribbling: p.dribbling,
        defending: p.defending,
        physical: p.physical,
        contract: p.contract,
        morale: p.morale,
        form: p.form,
        xp: p.xp,
        level: p.level,
        is_star_player: p.is_star_player,
      }))
    );

    if (updateError) {
      throw new ApiError({
        message: "Erro ao atualizar evolução dos jogadores",
        code: "PLAYER_UPDATE_FAILED",
        details: updateError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:players`);

    return NextResponse.json({
      success: true,
      message: "Jogadores evoluíram com sucesso",
      players: updatedPlayers,
    });
  } catch (error) {
    console.error("Erro ao processar evolução:", error);
    return NextResponse.json(
      { error: "Erro ao processar evolução dos jogadores" },
      { status: 500 }
    );
  }
}
