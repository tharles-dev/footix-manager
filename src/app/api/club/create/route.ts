import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createClubSchema } from "@/lib/api/schemas/club";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { cookies } from "next/headers";

const cookieStore = cookies();
const supabase = createServerClient(cookieStore);

export async function POST(request: Request) {
  try {
    // Verifica rate limit
    await checkRateLimit("club-create", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(createClubSchema, body);

    // Verifica se o usuário já tem um clube
    const { data: existingClub } = await supabase
      .from("clubs")
      .select("id")
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (existingClub) {
      throw new ApiError({
        message: "Você já possui um clube",
        code: "CLUB_ALREADY_EXISTS",
      });
    }

    // Verifica se o servidor existe e tem vagas
    const { data: server } = await supabase
      .from("servers")
      .select("id, current_members, max_members")
      .eq("id", data.server_id)
      .single();

    if (!server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    if (server.current_members >= server.max_members) {
      throw new ApiError({
        message: "Servidor está cheio",
        code: "SERVER_FULL",
      });
    }

    // Cria o clube
    const { data: club, error } = await supabase
      .from("clubs")
      .insert({
        ...data,
        user_id: request.headers.get("user-id"),
        balance: 5000000, // Saldo inicial
        reputation: 50, // Reputação inicial
        fan_base: 1000, // Torcida inicial
        stadium_capacity: 10000, // Capacidade inicial
        ticket_price: 20, // Preço do ingresso inicial
        season_ticket_holders: 100, // Sócios iniciais
      })
      .select()
      .single();

    if (error) {
      throw new ApiError({
        message: "Erro ao criar clube",
        code: "CLUB_CREATION_FAILED",
        details: error,
      });
    }

    // Atualiza o número de membros do servidor
    await supabase
      .from("servers")
      .update({ current_members: server.current_members + 1 })
      .eq("id", data.server_id);

    // Cache do clube por 5 minutos
    await setCachedData(`club:${club.id}`, club, 300);

    return NextResponse.json({
      message: "Clube criado com sucesso",
      data: club,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao criar clube:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
