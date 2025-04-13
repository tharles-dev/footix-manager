import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("user-id");
    if (!userId) {
      throw new ApiError({
        message: "Usuário não autenticado",
        code: "UNAUTHORIZED",
      });
    }

    const serverId = request.headers.get("server-id");
    if (!serverId) {
      throw new ApiError({
        message: "Server ID não fornecido",
        code: "BAD_REQUEST",
      });
    }

    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const clubId = searchParams.get("club_id");

    await checkRateLimit(userId);

    const supabase = createServerClient(cookies());

    // Verifica se o usuário é admin do servidor
    const { data: serverMember, error: serverError } = await supabase
      .from("server_members")
      .select("role")
      .eq("server_id", serverId)
      .eq("user_id", userId)
      .single();

    if (serverError || !serverMember) {
      throw new ApiError({
        message: "Usuário não tem permissão para acessar este servidor",
        code: "FORBIDDEN",
      });
    }

    if (serverMember.role !== "admin") {
      throw new ApiError({
        message: "Apenas administradores podem acessar o histórico de divisões",
        code: "FORBIDDEN",
      });
    }

    // Construir a query base
    let query = supabase
      .from("promotion_relegation_history")
      .select(
        `
        id,
        server_id,
        club_id,
        season,
        from_division_id,
        to_division_id,
        type,
        created_at,
        clubs (
          id,
          name,
          logo_url
        ),
        from_division:divisions!from_division_id (
          id,
          name,
          level
        ),
        to_division:divisions!to_division_id (
          id,
          name,
          level
        )
      `
      )
      .eq("server_id", serverId)
      .order("season", { ascending: false })
      .order("created_at", { ascending: false });

    // Aplicar filtros se fornecidos
    if (season) {
      query = query.eq("season", parseInt(season));
    }

    if (clubId) {
      query = query.eq("club_id", clubId);
    }

    // Executar a query
    const { data: history, error: historyError } = await query;

    if (historyError) {
      throw new ApiError({
        message: "Erro ao buscar histórico de divisões",
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    return NextResponse.json({ success: true, data: { history } });
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
