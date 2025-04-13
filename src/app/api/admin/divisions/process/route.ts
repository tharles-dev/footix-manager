import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient(cookies());
    const { server_id } = await request.json();

    if (!server_id) {
      throw new ApiError({
        message: "Server ID é obrigatório",
        code: "SERVER_ID_REQUIRED",
      });
    }

    // Check rate limit
    const userId = request.headers.get("user-id");
    if (!userId) {
      throw new ApiError({
        message: "Usuário não autenticado",
        code: "UNAUTHORIZED",
      });
    }

    await checkRateLimit(userId);

    // Verify user is admin of the server
    const { data: serverMember, error: serverMemberError } = await supabase
      .from("server_members")
      .select("role")
      .eq("server_id", server_id)
      .eq("user_id", userId)
      .single();

    if (serverMemberError || !serverMember || serverMember.role !== "admin") {
      throw new ApiError({
        message: "Acesso negado",
        code: "FORBIDDEN",
      });
    }

    // Get all divisions for the server
    const { data: divisions, error: divisionsError } = await supabase
      .from("divisions")
      .select("*")
      .eq("server_id", server_id)
      .order("level", { ascending: true });

    if (divisionsError) {
      throw new ApiError({
        message: "Erro ao buscar divisões",
        code: "DIVISIONS_FETCH_FAILED",
      });
    }

    if (!divisions || divisions.length < 2) {
      throw new ApiError({
        message: "Número insuficiente de divisões",
        code: "INSUFFICIENT_DIVISIONS",
      });
    }

    // Get current season
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("current_season")
      .eq("id", server_id)
      .single();

    if (serverError || !server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    const currentSeason = server.current_season;

    // Process each division (except the lowest)
    for (let i = 0; i < divisions.length - 1; i++) {
      const currentDivision = divisions[i];
      const nextDivision = divisions[i + 1];

      // Get clubs in current division ordered by points
      const { data: currentClubs, error: currentClubsError } = await supabase
        .from("competition_clubs")
        .select(
          `
          club_id,
          points,
          clubs (
            id,
            name
          )
        `
        )
        .eq("competition_id", currentDivision.id)
        .eq("season", currentSeason)
        .order("points", { ascending: false });

      if (currentClubsError) {
        throw new ApiError({
          message: "Erro ao buscar clubes da divisão atual",
          code: "CLUBS_FETCH_FAILED",
        });
      }

      // Get clubs in next division ordered by points
      const { data: nextClubs, error: nextClubsError } = await supabase
        .from("competition_clubs")
        .select(
          `
          club_id,
          points,
          clubs (
            id,
            name
          )
        `
        )
        .eq("competition_id", nextDivision.id)
        .eq("season", currentSeason)
        .order("points", { ascending: false });

      if (nextClubsError) {
        throw new ApiError({
          message: "Erro ao buscar clubes da próxima divisão",
          code: "CLUBS_FETCH_FAILED",
        });
      }

      // Process promotions
      const promotionSpots = currentDivision.promotion_spots;
      const clubsToPromote = currentClubs.slice(0, promotionSpots);

      // Process relegations
      const relegationSpots = nextDivision.relegation_spots;
      const clubsToRelegate = nextClubs.slice(-relegationSpots);

      // Update clubs' divisions and record history
      for (const club of clubsToPromote) {
        // Update club's division
        const { error: updateError } = await supabase
          .from("clubs")
          .update({ division_id: nextDivision.id })
          .eq("id", club.club_id);

        if (updateError) {
          throw new ApiError({
            message: "Erro ao atualizar divisão do clube",
            code: "CLUB_UPDATE_FAILED",
          });
        }

        // Record promotion history
        const { error: historyError } = await supabase
          .from("promotion_relegation_history")
          .insert({
            server_id,
            club_id: club.club_id,
            season: currentSeason,
            from_division_id: currentDivision.id,
            to_division_id: nextDivision.id,
            type: "promotion",
          });

        if (historyError) {
          throw new ApiError({
            message: "Erro ao registrar histórico de promoção",
            code: "HISTORY_RECORD_FAILED",
          });
        }
      }

      for (const club of clubsToRelegate) {
        // Update club's division
        const { error: updateError } = await supabase
          .from("clubs")
          .update({ division_id: currentDivision.id })
          .eq("id", club.club_id);

        if (updateError) {
          throw new ApiError({
            message: "Erro ao atualizar divisão do clube",
            code: "CLUB_UPDATE_FAILED",
          });
        }

        // Record relegation history
        const { error: historyError } = await supabase
          .from("promotion_relegation_history")
          .insert({
            server_id,
            club_id: club.club_id,
            season: currentSeason,
            from_division_id: nextDivision.id,
            to_division_id: currentDivision.id,
            type: "relegation",
          });

        if (historyError) {
          throw new ApiError({
            message: "Erro ao registrar histórico de rebaixamento",
            code: "HISTORY_RECORD_FAILED",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        season: currentSeason,
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
      { error: "Erro interno do servidor", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
