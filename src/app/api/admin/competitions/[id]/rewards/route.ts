import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api-error";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("user-id");
    if (!userId) {
      throw new ApiError("Não autorizado", 401);
    }

    // Verificar rate limit
    await checkRateLimit(userId);

    const supabase = createRouteHandlerClient({ cookies });

    // Verificar se o usuário é admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !user || user.role !== "admin") {
      throw new ApiError("Não autorizado", 401);
    }

    // Verificar se a competição existe
    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", params.id)
      .single();

    if (competitionError || !competition) {
      throw new ApiError("Competição não encontrada", 404);
    }

    // Verificar se a competição está finalizada
    if (competition.status !== "completed") {
      throw new ApiError(
        "A competição precisa estar finalizada para distribuir as premiações",
        400
      );
    }

    // Processar premiações
    const { error: processError } = await supabase.rpc(
      "process_competition_rewards",
      {
        p_competition_id: params.id,
      }
    );

    if (processError) {
      throw new ApiError(processError.message, 400);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
