import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { cookies } from "next/headers";

const cookieStore = cookies();
const supabase = createServerClient(cookieStore);

export async function GET(request: Request) {
  try {
    // Verifica rate limit
    await checkRateLimit("players-available", 30, 60); // 30 requisições por minuto

    // Obtém parâmetros da query
    const { searchParams } = new URL(request.url);
    const position = searchParams.get("position");
    const minAge = searchParams.get("min_age");
    const maxAge = searchParams.get("max_age");
    const minValue = searchParams.get("min_value");
    const maxValue = searchParams.get("max_value");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Verifica cache
    const cacheKey = `players-available:${position}:${minAge}:${maxAge}:${minValue}:${maxValue}:${page}:${limit}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json({
        message: "Jogadores recuperados do cache",
        data: cached,
      });
    }

    // Constrói a query
    let query = supabase
      .from("server_players")
      .select(
        `
        id,
        name,
        age,
        nationality,
        position,
        attributes,
        base_salary,
        base_value,
        club_id
      `
      )
      .is("club_id", null); // Apenas jogadores sem clube

    // Aplica filtros
    if (position) {
      query = query.eq("position", position);
    }
    if (minAge) {
      query = query.gte("age", parseInt(minAge));
    }
    if (maxAge) {
      query = query.lte("age", parseInt(maxAge));
    }
    if (minValue) {
      query = query.gte("base_value", parseFloat(minValue));
    }
    if (maxValue) {
      query = query.lte("base_value", parseFloat(maxValue));
    }

    // Aplica paginação
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    // Executa a query
    const { data: players, error, count } = await query;

    if (error) {
      throw new ApiError({
        message: "Erro ao buscar jogadores",
        code: "PLAYERS_FETCH_FAILED",
        details: error,
      });
    }

    // Cache por 5 minutos
    const result = {
      players,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
    await setCachedData(cacheKey, result, 300);

    return NextResponse.json({
      message: "Jogadores recuperados com sucesso",
      data: result,
    });
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
