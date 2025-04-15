import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { updateTacticsSchema } from "@/lib/api/schemas/club";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { cookies } from "next/headers";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    const { data: user } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError({
        message: "Usuário não autenticado",
        code: "UNAUTHORIZED",
      });
    }

    // Verifica rate limit
    await checkRateLimit("club-tactics-update", 10, 60); // 10 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(updateTacticsSchema, body);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id, server_id")
      .eq("id", params.id)
      .eq("user_id", user.user?.id)
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Verifica se o servidor especificado corresponde ao do clube
    if (club.server_id !== data.server_id) {
      throw new ApiError({
        message: "O servidor especificado não corresponde ao do clube",
        code: "INVALID_SERVER",
      });
    }

    // Verifica se todos os jogadores pertencem ao clube
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
        morale,
        form
      `
      )
      .eq("club_id", params.id)
      .in("id", [...data.starting_ids, ...data.bench_ids]);

    if (
      !players ||
      players.length !== data.starting_ids.length + data.bench_ids.length
    ) {
      throw new ApiError({
        message: "Um ou mais jogadores não pertencem ao clube",
        code: "INVALID_PLAYERS",
      });
    }

    // Verifica se o capitão está entre os titulares
    if (!data.starting_ids.includes(data.captain_id)) {
      throw new ApiError({
        message: "O capitão deve estar entre os titulares",
        code: "INVALID_CAPTAIN",
      });
    }

    // Verifica se o cobrador de falta está entre os jogadores selecionados
    if (
      data.free_kick_taker_id &&
      ![...data.starting_ids, ...data.bench_ids].includes(
        data.free_kick_taker_id
      )
    ) {
      throw new ApiError({
        message:
          "O cobrador de falta deve estar entre os jogadores selecionados",
        code: "INVALID_FREE_KICK_TAKER",
      });
    }

    // Verifica se o cobrador de pênalti está entre os jogadores selecionados
    if (
      data.penalty_taker_id &&
      ![...data.starting_ids, ...data.bench_ids].includes(data.penalty_taker_id)
    ) {
      throw new ApiError({
        message:
          "O cobrador de pênalti deve estar entre os jogadores selecionados",
        code: "INVALID_PENALTY_TAKER",
      });
    }

    // Atualiza a tática
    const { error } = await supabase.from("club_tactics").upsert({
      club_id: params.id,
      formation: data.formation,
      starting_ids: data.starting_ids,
      bench_ids: data.bench_ids,
      captain_id: data.captain_id,
      free_kick_taker_id: data.free_kick_taker_id,
      penalty_taker_id: data.penalty_taker_id,
      play_style: data.play_style,
      marking: data.marking,
      server_id: data.server_id,
    });

    if (error) {
      console.log("error", error);
      throw new ApiError({
        message: "Erro ao atualizar tática",
        code: "TACTICS_UPDATE_FAILED",
        details: error,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:tactics`);

    return NextResponse.json({
      message: "Tática atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar tática:", error);
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
    await checkRateLimit("club-tactics-get", 30, 60); // 30 requisições por minuto

    // Verifica cache
    const cached = await getCachedData(`club:${params.id}:tactics`);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Buscar táticas salvas
    const { data: tactics, error: tacticsError } = await supabase
      .from("club_tactics")
      .select(
        `
        formation,
        starting_ids,
        bench_ids,
        captain_id,
        free_kick_taker_id,
        penalty_taker_id,
        play_style,
        marking
      `
      )
      .eq("club_id", params.id)
      .single();

    if (tacticsError) {
      console.error("Erro ao buscar táticas:", tacticsError);
      return NextResponse.json(
        { error: "Erro ao buscar táticas" },
        { status: 500 }
      );
    }

    // Buscar jogadores titulares
    const { data: startingPlayers, error: startingError } = await supabase
      .from("server_players")
      .select("*")
      .in("id", tactics?.starting_ids || []);

    if (startingError) {
      console.error("Erro ao buscar jogadores titulares:", startingError);
      return NextResponse.json(
        { error: "Erro ao buscar jogadores titulares" },
        { status: 500 }
      );
    }

    // Buscar jogadores reservas
    const { data: benchPlayers, error: benchError } = await supabase
      .from("server_players")
      .select("*")
      .in("id", tactics?.bench_ids || []);

    if (benchError) {
      console.error("Erro ao buscar jogadores reservas:", benchError);
      return NextResponse.json(
        { error: "Erro ao buscar jogadores reservas" },
        { status: 500 }
      );
    }

    // Combinar os resultados
    const response = {
      ...tactics,
      startingPlayers: startingPlayers || [],
      benchPlayers: benchPlayers || [],
    };

    // Cachear por 5 minutos
    await setCachedData(`club:${params.id}:tactics`, response, 300);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar tática:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
