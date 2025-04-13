import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";

// GET /api/competitions/[server_id]
export async function GET(
  request: Request,
  { params }: { params: { server_id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("competitions-list", 30, 60); // 30 requisições por minuto

    // Verifica se o servidor existe
    const { data: server } = await supabase
      .from("servers")
      .select("id, status, season")
      .eq("id", params.server_id)
      .single();

    if (!server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    // Busca competições do servidor
    const { data: competitions, error } = await supabase
      .from("competitions")
      .select(
        `
        id,
        name,
        type,
        season,
        points_win,
        points_draw,
        tie_break_order,
        reward_schema,
        red_card_penalty
      `
      )
      .eq("server_id", params.server_id)
      .eq("season", server.season)
      .order("type", { ascending: true });

    if (error) {
      throw new ApiError({
        message: "Erro ao buscar competições",
        code: "COMPETITIONS_FETCH_FAILED",
        details: error,
      });
    }

    // Busca clubes participantes de cada competição
    const competitionsWithClubs = await Promise.all(
      competitions.map(async (competition) => {
        const { data: clubs } = await supabase
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
          .eq("competition_id", competition.id);

        return {
          ...competition,
          clubs: clubs || [],
        };
      })
    );

    return NextResponse.json({
      data: {
        server_id: params.server_id,
        season: server.season,
        status: server.status,
        competitions: competitionsWithClubs,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar competições:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
