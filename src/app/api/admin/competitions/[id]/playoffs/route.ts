import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";

// GET /api/admin/competitions/[id]/playoffs
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar rate limit
    const userId = request.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await checkRateLimit(userId, 30, 60);

    // Criar cliente Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Buscar playoffs da competição
    const { data: playoffs, error: playoffsError } = await supabase
      .from("playoffs")
      .select(
        `
        *,
        competition:competitions (
          id,
          name,
          type,
          season
        )
      `
      )
      .eq("competition_id", params.id)
      .order("season", { ascending: false });

    if (playoffsError) {
      throw new ApiError({
        message: "Erro ao buscar playoffs",
        code: "PLAYOFFS_FETCH_FAILED",
      });
    }

    // Buscar partidas dos playoffs
    const { data: matches, error: matchesError } = await supabase
      .from("playoff_matches")
      .select(
        `
        *,
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
      .in(
        "playoff_id",
        playoffs.map((p) => p.id)
      )
      .order("round", { ascending: true })
      .order("match_number", { ascending: true });

    if (matchesError) {
      throw new ApiError({
        message: "Erro ao buscar partidas",
        code: "MATCHES_FETCH_FAILED",
      });
    }

    // Organizar partidas por playoff
    const playoffsWithMatches = playoffs.map((playoff) => ({
      ...playoff,
      matches: matches.filter((m) => m.playoff_id === playoff.id),
    }));

    return NextResponse.json({
      data: {
        playoffs: playoffsWithMatches,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/admin/competitions/[id]/playoffs
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar rate limit
    const userId = request.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await checkRateLimit(userId, 5, 60);

    // Obter dados da requisição
    const { top_teams = 8 } = await request.json();

    // Validar dados
    if (typeof top_teams !== "number" || top_teams < 4 || top_teams > 16) {
      throw new ApiError({
        message: "Número de times deve estar entre 4 e 16",
        code: "INVALID_DATA",
      });
    }

    // Criar cliente Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Buscar competição
    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", params.id)
      .single();

    if (competitionError || !competition) {
      throw new ApiError({
        message: "Competição não encontrada",
        code: "COMPETITION_NOT_FOUND",
      });
    }

    // Verificar se já existem playoffs para esta temporada
    const { data: existingPlayoff, error: existingError } = await supabase
      .from("playoffs")
      .select("*")
      .eq("competition_id", params.id)
      .eq("season", competition.season)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      throw new ApiError({
        message: "Erro ao verificar playoffs existentes",
        code: "PLAYOFF_CHECK_FAILED",
      });
    }

    if (existingPlayoff) {
      throw new ApiError({
        message: "Playoffs já existem para esta temporada",
        code: "PLAYOFF_ALREADY_EXISTS",
      });
    }

    // Gerar playoffs
    const { data: playoffId, error: generateError } = await supabase.rpc(
      "generate_playoffs",
      {
        p_competition_id: params.id,
        p_season: competition.season,
        p_top_teams: top_teams,
      }
    );

    if (generateError) {
      throw new ApiError({
        message: "Erro ao gerar playoffs",
        code: "PLAYOFF_GENERATION_FAILED",
      });
    }

    // Buscar playoffs gerados
    const { data: playoff, error: playoffError } = await supabase
      .from("playoffs")
      .select(
        `
        *,
        competition:competitions (
          id,
          name,
          type,
          season
        )
      `
      )
      .eq("id", playoffId)
      .single();

    if (playoffError || !playoff) {
      throw new ApiError({
        message: "Erro ao buscar playoffs",
        code: "PLAYOFF_FETCH_FAILED",
      });
    }

    // Buscar partidas geradas
    const { data: matches, error: matchesError } = await supabase
      .from("playoff_matches")
      .select(
        `
        *,
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
      .eq("playoff_id", playoffId)
      .order("round", { ascending: true })
      .order("match_number", { ascending: true });

    if (matchesError) {
      throw new ApiError({
        message: "Erro ao buscar partidas",
        code: "MATCHES_FETCH_FAILED",
      });
    }

    // Invalidar cache
    await invalidateCache(`competition:${params.id}:playoffs`);

    return NextResponse.json({
      message: "Playoffs gerados com sucesso",
      data: {
        playoff: {
          ...playoff,
          matches,
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

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
