import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";

// POST /api/club/[id]/finance/salary/process
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-salary-process", 5, 60); // 5 requisições por minuto

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id, balance, server_id")
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Busca configurações do servidor
    const { data: server } = await supabase
      .from("servers")
      .select("salary_cap, salary_cap_penalty_percentage")
      .eq("id", club.server_id)
      .single();

    if (!server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    // Busca todos os jogadores do clube
    const { data: players } = await supabase
      .from("server_players")
      .select("id, name, contract")
      .eq("club_id", params.id)
      .not("is_on_loan", "eq", true);

    if (!players || players.length === 0) {
      throw new ApiError({
        message: "Nenhum jogador encontrado no clube",
        code: "NO_PLAYERS_FOUND",
      });
    }

    // Calcula total de salários
    const totalSalaries = players.reduce((total, player) => {
      return total + (player.contract?.salary || 0);
    }, 0);

    // Verifica teto salarial
    const salaryCapExceeded = totalSalaries > server.salary_cap;
    const penaltyAmount = salaryCapExceeded
      ? (totalSalaries - server.salary_cap) *
        server.salary_cap_penalty_percentage
      : 0;

    // Verifica se o clube tem saldo suficiente
    if (club.balance < totalSalaries) {
      throw new ApiError({
        message: "Saldo insuficiente para pagar os salários",
        code: "INSUFFICIENT_BALANCE",
        details: {
          required: totalSalaries,
          available: club.balance,
        },
      });
    }

    // Inicia transação
    const { error: transactionError } = await supabase.rpc(
      "process_monthly_salaries",
      {
        p_club_id: params.id,
        p_total_salaries: totalSalaries,
        p_penalty_amount: penaltyAmount,
      }
    );

    if (transactionError) {
      throw new ApiError({
        message: "Erro ao processar salários",
        code: "SALARY_PROCESSING_FAILED",
        details: transactionError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Salários processados com sucesso",
      data: {
        total_salaries: totalSalaries,
        salary_cap: server.salary_cap,
        salary_cap_exceeded: salaryCapExceeded,
        penalty_amount: penaltyAmount,
        players_processed: players.length,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao processar salários:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
