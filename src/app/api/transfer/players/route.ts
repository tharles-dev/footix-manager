import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { listPlayersSchema } from "@/lib/api/schemas/transfer";
import { listPlayers } from "@/lib/api/services/transfer";
import { ZodError } from "zod";

interface ApiError {
  code:
    | "UNAUTHORIZED"
    | "BAD_REQUEST"
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "INTERNAL_SERVER_ERROR"
    | "INVALID_PARAMETERS";
  message: string;
  details?: unknown;
}

export async function GET(req: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const cookiesStore = cookies();
    const supabase = createServerClient(cookiesStore);

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw { code: "UNAUTHORIZED", message: "Não autorizado" } as ApiError;
    }

    // Obter servidor do usuário
    const { data: serverMember } = await supabase
      .from("server_members")
      .select("server_id")
      .eq("user_id", user.id)
      .single();

    if (!serverMember) {
      throw {
        code: "BAD_REQUEST",
        message: "Usuário não pertence a nenhum servidor",
      } as ApiError;
    }

    // Obter parâmetros da URL
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);

    // Validar parâmetros
    const validatedParams = listPlayersSchema.parse(searchParams);

    // Buscar jogadores
    const result = await listPlayers(
      supabase,
      serverMember.server_id,
      validatedParams
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao listar jogadores:", error);

    if (error instanceof ZodError) {
      const apiError: ApiError = {
        code: "INVALID_PARAMETERS",
        message: "Parâmetros inválidos",
        details: error.errors,
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    // Erros conhecidos
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof error.code === "string" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      const apiError = error as ApiError;
      const statusMap: Record<ApiError["code"], number> = {
        UNAUTHORIZED: 401,
        BAD_REQUEST: 400,
        NOT_FOUND: 404,
        FORBIDDEN: 403,
        INVALID_PARAMETERS: 400,
        INTERNAL_SERVER_ERROR: 500,
      };

      return NextResponse.json(apiError, { status: statusMap[apiError.code] });
    }

    // Erro interno do servidor
    const apiError: ApiError = {
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro interno do servidor",
    };
    return NextResponse.json(apiError, { status: 500 });
  }
}
