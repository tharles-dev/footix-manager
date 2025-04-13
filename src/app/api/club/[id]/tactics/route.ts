import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateTacticsSchema } from "@/lib/api/schemas/club";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica rate limit
    await checkRateLimit("club-tactics", 10, 60); // 10 requisições por minuto

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
        message: "Clube não encontrado ou não autorizado",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Verifica se todos os jogadores pertencem ao clube
    const allPlayerIds = [
      ...data.starting_ids,
      ...data.bench_ids,
      data.captain_id,
    ];
    const { data: players, error: playersError } = await supabase
      .from("server_players")
      .select("id")
      .eq("club_id", params.id)
      .in("id", allPlayerIds);

    if (playersError || !players || players.length !== allPlayerIds.length) {
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
    const { data: tactics, error: tacticsError } = await supabase
      .from("club_tactics")
      .upsert({
        club_id: params.id,
        formation: data.formation,
        starting_ids: data.starting_ids,
        bench_ids: data.bench_ids,
        captain_id: data.captain_id,
      })
      .select()
      .single();

    if (tacticsError) {
      throw new ApiError({
        message: "Erro ao atualizar tática",
        code: "TACTICS_UPDATE_FAILED",
        details: tacticsError,
      });
    }

    // Invalida o cache do clube
    await invalidateCache(`club:${params.id}`);

    return NextResponse.json({
      message: "Tática atualizada com sucesso",
      data: tactics,
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
    // Verifica rate limit
    await checkRateLimit("club-tactics", 30, 60); // 30 requisições por minuto

    // Verifica cache
    const cacheKey = `club-tactics:${params.id}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json({
        message: "Tática recuperada do cache",
        data: cached,
      });
    }

    // Busca a tática
    const { data: tactics, error } = await supabase
      .from("club_tactics")
      .select(
        `
        *,
        starting_players:starting_ids (
          id,
          name,
          position,
          attributes
        ),
        bench_players:bench_ids (
          id,
          name,
          position,
          attributes
        ),
        captain:captain_id (
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
      if (error.code === "PGRST116") {
        return NextResponse.json({
          message: "Tática não encontrada",
          data: null,
        });
      }

      throw new ApiError({
        message: "Erro ao buscar tática",
        code: "TACTICS_FETCH_FAILED",
        details: error,
      });
    }

    // Cache por 5 minutos
    await setCachedData(cacheKey, tactics, 300);

    return NextResponse.json({
      message: "Tática recuperada com sucesso",
      data: tactics,
    });
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
