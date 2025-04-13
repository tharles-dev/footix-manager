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
        message: "Apenas administradores podem acessar as divisões",
        code: "FORBIDDEN",
      });
    }

    // Busca todas as divisões do servidor
    const { data: divisions, error: divisionsError } = await supabase
      .from("divisions")
      .select("*")
      .eq("server_id", serverId)
      .order("level", { ascending: true });

    if (divisionsError) {
      throw new ApiError({
        message: "Erro ao buscar divisões",
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    return NextResponse.json({ success: true, data: { divisions } });
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

export async function POST(request: Request) {
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
        message: "Apenas administradores podem criar divisões",
        code: "FORBIDDEN",
      });
    }

    const body = await request.json();
    const { name, level, promotion_spots, relegation_spots } = body;

    if (!name || !level || !promotion_spots || !relegation_spots) {
      throw new ApiError({
        message: "Dados incompletos para criar divisão",
        code: "BAD_REQUEST",
      });
    }

    // Verifica se já existe uma divisão com o mesmo nível
    const { data: existingDivision, error: checkError } = await supabase
      .from("divisions")
      .select("id")
      .eq("server_id", serverId)
      .eq("level", level)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw new ApiError({
        message: "Erro ao verificar divisão existente",
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    if (existingDivision) {
      throw new ApiError({
        message: "Já existe uma divisão com este nível",
        code: "BAD_REQUEST",
      });
    }

    // Cria a nova divisão
    const { data: division, error: createError } = await supabase
      .from("divisions")
      .insert({
        server_id: serverId,
        name,
        level,
        promotion_spots,
        relegation_spots,
      })
      .select()
      .single();

    if (createError) {
      throw new ApiError({
        message: "Erro ao criar divisão",
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    return NextResponse.json({
      success: true,
      data: { division },
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
