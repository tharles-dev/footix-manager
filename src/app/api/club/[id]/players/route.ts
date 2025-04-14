import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { addPlayerSchema } from "@/lib/api/schemas/club";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { cookies } from "next/headers";
import { z } from "zod";

type AddPlayerData = z.infer<typeof addPlayerSchema>;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-player-add", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(addPlayerSchema, body) as AddPlayerData;

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

    // Verifica se o jogador existe no servidor
    const { data: serverPlayer } = await supabase
      .from("server_players")
      .select("id, name, position")
      .eq("id", data.player_id)
      .eq("server_id", club.server_id)
      .single();

    if (!serverPlayer) {
      throw new ApiError({
        message: "Jogador não encontrado no servidor",
        code: "PLAYER_NOT_FOUND",
      });
    }

    // Verifica se o jogador já está no clube
    const { data: existingPlayer } = await supabase
      .from("club_players")
      .select("id")
      .eq("club_id", params.id)
      .eq("player_id", data.player_id)
      .single();

    if (existingPlayer) {
      throw new ApiError({
        message: "Jogador já está no clube",
        code: "PLAYER_ALREADY_EXISTS",
      });
    }

    // Adiciona o jogador ao clube
    const { error } = await supabase.from("club_players").insert({
      club_id: params.id,
      player_id: data.player_id,
      number: data.number,
      position: serverPlayer.position,
    });

    if (error) {
      throw new ApiError({
        message: "Erro ao adicionar jogador",
        code: "PLAYER_ADD_FAILED",
        details: error,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:players`);

    return NextResponse.json({
      message: "Jogador adicionado com sucesso",
      data: {
        id: data.player_id,
        name: serverPlayer.name,
        position: serverPlayer.position,
        number: data.number,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao adicionar jogador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-players-get", 30, 60); // 30 requisições por minuto

    // Verifica cache
    const cached = await getCachedData(`club:${params.id}:players`);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Busca os jogadores
    const { data: players, error: playersError } = await supabase
      .from("server_players")
      .select(
        `
        id,
        name,
        age,
        nationality,
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
      .eq("club_id", params.id);

    if (playersError) {
      throw new ApiError({
        message: "Erro ao buscar jogadores",
        code: "PLAYERS_FETCH_FAILED",
        details: playersError,
      });
    }

    // Só armazena em cache se houver jogadores
    if (players && players.length > 0) {
      // Cache por 5 minutos
      await setCachedData(`club:${params.id}:players`, players, 300);
    }

    return NextResponse.json(players);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar jogadores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
