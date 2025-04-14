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

    // Verifica rate limit
    await checkRateLimit("club-tactics-update", 10, 60); // 10 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(updateTacticsSchema, body);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
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

    // Atualiza a tática
    const { error } = await supabase.from("club_tactics").upsert({
      club_id: params.id,
      formation: data.formation,
      starting_ids: data.starting_ids,
      bench_ids: data.bench_ids,
      captain_id: data.captain_id,
    });

    if (error) {
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

    // Busca a tática
    const { data: tactics, error } = await supabase
      .from("club_tactics")
      .select(
        `
        formation,
        starting_ids,
        bench_ids,
        captain_id,
        starting:server_players!starting_ids(
          id,
          name,
          position,
          attributes
        ),
        bench:server_players!bench_ids(
          id,
          name,
          position,
          attributes
        )
      `
      )
      .eq("club_id", params.id)
      .single();

    if (error) {
      throw new ApiError({
        message: "Erro ao buscar tática",
        code: "TACTICS_FETCH_FAILED",
        details: error,
      });
    }

    // Cache por 5 minutos
    await setCachedData(`club:${params.id}:tactics`, tactics, 300);

    return NextResponse.json(tactics);
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
