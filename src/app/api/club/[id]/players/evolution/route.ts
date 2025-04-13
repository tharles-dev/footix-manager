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
        attributes,
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
    const updatedPlayers = players.map((player) => {
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
      const attributes = { ...player.attributes };
      const attributeIncrease = Math.floor((newLevel - player.level) * 2); // +2 por nível

      // Distribui aumento de atributos baseado na posição
      const positionAttributes = getPositionAttributes(player.position);
      positionAttributes.forEach((attr) => {
        attributes[attr] = Math.min(99, attributes[attr] + attributeIncrease);
      });

      // Atualiza valor de mercado
      const baseValue = player.contract.base_value || 1000000;
      const newValue = Math.floor(
        baseValue *
          (1 + (newLevel - player.level) * 0.1) *
          server.market_value_multiplier
      );

      return {
        id: player.id,
        xp: newXp,
        level: newLevel,
        attributes,
        contract: {
          ...player.contract,
          base_value: newValue,
        },
      };
    });

    // Atualiza jogadores no banco
    const { error: updateError } = await supabase.from("server_players").upsert(
      updatedPlayers.map((p) => ({
        id: p.id,
        xp: p.xp,
        level: p.level,
        attributes: p.attributes,
        contract: p.contract,
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
      message: "Evolução dos jogadores processada com sucesso",
      data: {
        players_processed: updatedPlayers.length,
        players: updatedPlayers.map((p) => ({
          id: p.id,
          level: p.level,
          xp: p.xp,
          attributes: p.attributes,
          new_value: p.contract.base_value,
        })),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao processar evolução dos jogadores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função auxiliar para determinar atributos relevantes por posição
function getPositionAttributes(position: string): string[] {
  const attributesMap: Record<string, string[]> = {
    GK: ["reflexes", "handling", "positioning", "aerial", "command"],
    CB: ["tackling", "marking", "positioning", "strength", "aerial"],
    LB: ["tackling", "marking", "pace", "stamina", "crossing"],
    RB: ["tackling", "marking", "pace", "stamina", "crossing"],
    CDM: ["tackling", "passing", "vision", "positioning", "strength"],
    CM: ["passing", "vision", "technique", "stamina", "positioning"],
    CAM: ["passing", "vision", "technique", "dribbling", "shooting"],
    LW: ["pace", "dribbling", "crossing", "technique", "shooting"],
    RW: ["pace", "dribbling", "crossing", "technique", "shooting"],
    ST: ["shooting", "finishing", "pace", "strength", "aerial"],
  };

  return attributesMap[position] || [];
}
