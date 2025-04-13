import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import {
  updateTicketPriceSchema,
  updateStadiumCapacitySchema,
  updateSeasonTicketPriceSchema,
  payPenaltySchema,
  requestLoanSchema,
  payLoanSchema,
} from "@/lib/api/schemas/club";

// GET /api/club/[id]/finance
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance", 30, 60); // 30 requisições por minuto

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select(
        `
        id,
        balance,
        season_budget_base,
        season_budget_bonus,
        season_expenses,
        stadium_capacity,
        ticket_price,
        season_ticket_holders,
        season_ticket_price,
        server:servers!inner (
          salary_cap,
          salary_cap_penalty_percentage
        )
      `
      )
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Busca gastos com salários
    const { data: salaryExpenses } = await supabase
      .from("server_players")
      .select("contract")
      .eq("club_id", params.id)
      .not("is_on_loan", "eq", true);

    const totalSalary =
      salaryExpenses?.reduce((acc, player) => {
        return acc + (player.contract?.salary || 0);
      }, 0) || 0;

    // Busca multas pendentes
    const { data: penalties } = await supabase
      .from("penalties")
      .select("*")
      .eq("club_id", params.id)
      .eq("status", "pending");

    // Busca empréstimos ativos
    const { data: loans } = await supabase
      .from("loans")
      .select("*")
      .eq("club_id", params.id)
      .eq("status", "active");

    return NextResponse.json({
      data: {
        balance: club.balance,
        season_budget: {
          base: club.season_budget_base,
          bonus: club.season_budget_bonus,
          total: club.season_budget_base + club.season_budget_bonus,
        },
        expenses: {
          total: club.season_expenses,
          salary: totalSalary,
          salary_cap: club.server[0].salary_cap,
          salary_cap_penalty_percentage:
            club.server[0].salary_cap_penalty_percentage,
        },
        stadium: {
          capacity: club.stadium_capacity,
          ticket_price: club.ticket_price,
          season_ticket_holders: club.season_ticket_holders,
          season_ticket_price: club.season_ticket_price,
        },
        penalties: penalties || [],
        loans: loans || [],
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar finanças:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/club/[id]/finance/ticket-price
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-update", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(updateTicketPriceSchema, body);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Atualiza o preço do ingresso
    const { error } = await supabase
      .from("clubs")
      .update({ ticket_price: data.ticket_price })
      .eq("id", params.id);

    if (error) {
      throw new ApiError({
        message: "Erro ao atualizar preço do ingresso",
        code: "TICKET_PRICE_UPDATE_FAILED",
        details: error,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Preço do ingresso atualizado com sucesso",
      data: { ticket_price: data.ticket_price },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar preço do ingresso:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/club/[id]/finance/penalty/pay
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-penalty", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(payPenaltySchema, body);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id, balance")
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Busca a multa
    const { data: penalty } = await supabase
      .from("penalties")
      .select("*")
      .eq("id", data.penalty_id)
      .eq("club_id", params.id)
      .eq("status", "pending")
      .single();

    if (!penalty) {
      throw new ApiError({
        message: "Multa não encontrada ou já paga",
        code: "PENALTY_NOT_FOUND",
      });
    }

    // Verifica se o clube tem saldo suficiente
    if (club.balance < penalty.amount) {
      throw new ApiError({
        message: "Saldo insuficiente para pagar a multa",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Atualiza o saldo e o status da multa
    const { error: updateError } = await supabase
      .from("clubs")
      .update({ balance: club.balance - penalty.amount })
      .eq("id", params.id);

    if (updateError) {
      throw new ApiError({
        message: "Erro ao atualizar saldo",
        code: "BALANCE_UPDATE_FAILED",
        details: updateError,
      });
    }

    const { error: penaltyError } = await supabase
      .from("penalties")
      .update({ status: "paid" })
      .eq("id", data.penalty_id);

    if (penaltyError) {
      throw new ApiError({
        message: "Erro ao atualizar status da multa",
        code: "PENALTY_UPDATE_FAILED",
        details: penaltyError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Multa paga com sucesso",
      data: {
        penalty_id: data.penalty_id,
        amount: penalty.amount,
        new_balance: club.balance - penalty.amount,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao pagar multa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
