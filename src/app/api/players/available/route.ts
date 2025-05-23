import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { cookies } from "next/headers";
import { z } from "zod";

const cookieStore = cookies();
const supabase = createServerClient(cookieStore);

// Schema para validação dos parâmetros
const querySchema = z.object({
  position: z
    .enum([
      "GK",
      "RMF",
      "DMF",
      "CB",
      "CF",
      "LB",
      "RB",
      "AMF",
      "RWF",
      "SS",
      "LWF",
      "LMF",
      "CMF",
    ])
    .optional(),
  min_age: z.string().optional(),
  max_age: z.string().optional(),
  min_value: z.string().optional(),
  max_value: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    // Verifica rate limit
    await checkRateLimit("players-available", 30, 60); // 30 requisições por minuto

    // Obtém e valida parâmetros da query
    const { searchParams } = new URL(request.url);
    const validatedParams = querySchema.parse(Object.fromEntries(searchParams));
    const {
      position,
      min_age,
      max_age,
      min_value,
      max_value,
      page = "1",
      limit = "20",
    } = validatedParams;

    // Verifica cache
    const cacheKey = `players-available:${position}:${min_age}:${max_age}:${min_value}:${max_value}:${page}:${limit}`;
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
        overall,
        potential,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
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
    if (min_age) {
      query = query.gte("age", parseInt(min_age));
    }
    if (max_age) {
      query = query.lte("age", parseInt(max_age));
    }
    if (min_value) {
      query = query.gte("base_value", parseFloat(min_value));
    }
    if (max_value) {
      query = query.lte("base_value", parseFloat(max_value));
    }

    // Aplica paginação
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit) - 1;
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
        pages: Math.ceil((count || 0) / parseInt(limit)),
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
