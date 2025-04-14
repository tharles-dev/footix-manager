import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

// Schema para validação dos parâmetros de consulta
const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
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
  min_age: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  max_age: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  min_value: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  max_value: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Criar cliente Supabase
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário é administrador
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.role !== "admin") {
      return NextResponse.json(
        {
          error: "Acesso negado",
          message: "Usuário não tem permissão de administrador",
        },
        { status: 403 }
      );
    }

    // Obter e validar parâmetros de consulta
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const {
      page,
      limit,
      position,
      min_age,
      max_age,
      min_value,
      max_value,
      search,
    } = querySchema.parse(queryParams);

    // Construir consulta
    let query = supabase.from("global_players").select("*", { count: "exact" });

    // Aplicar filtros
    if (position) {
      query = query.eq("position", position);
    }

    if (min_age !== undefined) {
      query = query.gte("age", min_age);
    }

    if (max_age !== undefined) {
      query = query.lte("age", max_age);
    }

    if (min_value !== undefined) {
      query = query.gte("base_value", min_value);
    }

    if (max_value !== undefined) {
      query = query.lte("base_value", max_value);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Aplicar paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order("overall", { ascending: false });

    // Executar consulta
    const { data, error, count } = await query;

    if (error) {
      throw new ApiError({ message: error.message, code: error.code });
    }

    // Retornar resposta
    return NextResponse.json({
      data: {
        players: data,
        pagination: {
          total: count || 0,
          page,
          limit,
          total_pages: count ? Math.ceil(count / limit) : 0,
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar jogadores globais:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao buscar jogadores globais" },
      { status: 500 }
    );
  }
}
