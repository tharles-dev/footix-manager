import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { hirePlayerSchema } from "@/lib/api/schemas/club";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { cookies } from "next/headers";

const cookieStore = cookies();
const supabase = createServerClient(cookieStore);

export async function POST(request: Request) {
  try {
    // Verifica rate limit
    await checkRateLimit("transfer-hire", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(hirePlayerSchema, body);

    // Verifica se o jogador existe e está disponível
    const { data: player, error: playerError } = await supabase
      .from("server_players")
      .select("id, base_salary, base_value")
      .eq("id", data.player_id)
      .is("club_id", null)
      .single();

    if (playerError || !player) {
      throw new ApiError({
        message: "Jogador não encontrado ou já contratado",
        code: "PLAYER_NOT_AVAILABLE",
      });
    }

    // Verifica se o salário está dentro dos limites do servidor
    const { data: server } = await supabase
      .from("servers")
      .select("min_player_salary_percentage, max_player_salary_percentage")
      .eq("id", request.headers.get("server-id"))
      .single();

    if (!server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    const minSalary =
      player.base_salary * (server.min_player_salary_percentage / 100);
    const maxSalary =
      player.base_salary * (server.max_player_salary_percentage / 100);

    if (data.salary < minSalary || data.salary > maxSalary) {
      throw new ApiError({
        message: `Salário deve estar entre ${minSalary} e ${maxSalary}`,
        code: "INVALID_SALARY",
      });
    }

    // Verifica se o clube tem saldo suficiente
    const { data: club } = await supabase
      .from("clubs")
      .select("id, balance")
      .eq("id", request.headers.get("club-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado",
        code: "CLUB_NOT_FOUND",
      });
    }

    const totalCost = data.salary * 12 * data.contract_years; // Salário anual * anos
    if (club.balance < totalCost) {
      throw new ApiError({
        message: "Saldo insuficiente para contratar o jogador",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Inicia a transação
    const { error: transactionError } = await supabase.rpc("hire_player", {
      p_player_id: data.player_id,
      p_club_id: club.id,
      p_salary: data.salary,
      p_contract_years: data.contract_years,
    });

    if (transactionError) {
      throw new ApiError({
        message: "Erro ao contratar jogador",
        code: "HIRE_PLAYER_FAILED",
        details: transactionError,
      });
    }

    // Invalida caches
    await Promise.all([
      invalidateCache(`club:${club.id}`),
      invalidateCache(`player:${data.player_id}`),
      invalidateCache("players-available:*"),
    ]);

    return NextResponse.json({
      message: "Jogador contratado com sucesso",
      data: {
        player_id: data.player_id,
        club_id: club.id,
        salary: data.salary,
        contract_years: data.contract_years,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao contratar jogador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
