import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { requestLoanSchema } from "@/lib/api/schemas/club";

// POST /api/club/[id]/finance/loan/request
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-loan-request", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(requestLoanSchema, body);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id, balance, reputation")
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Verifica se o clube já tem empréstimos ativos
    const { data: activeLoans } = await supabase
      .from("loans")
      .select("*")
      .eq("club_id", params.id)
      .eq("status", "active");

    if (activeLoans && activeLoans.length > 0) {
      throw new ApiError({
        message: "Clube já possui empréstimos ativos",
        code: "ACTIVE_LOANS_EXIST",
      });
    }

    // Calcula juros baseado na reputação do clube
    const baseInterestRate = 0.05; // 5% ao mês
    const reputationFactor = Math.max(
      0.5,
      Math.min(1.5, club.reputation / 100)
    );
    const interestRate = baseInterestRate * reputationFactor;

    // Calcula valor total a ser pago
    const totalAmount = data.amount * (1 + interestRate * data.duration_months);

    // Cria o empréstimo
    const { error } = await supabase.from("loans").insert({
      club_id: params.id,
      amount: data.amount,
      interest_rate: interestRate,
      duration_months: data.duration_months,
      total_amount: totalAmount,
      status: "active",
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new ApiError({
        message: "Erro ao criar empréstimo",
        code: "LOAN_CREATION_FAILED",
        details: error,
      });
    }

    // Atualiza o saldo do clube
    const { error: updateError } = await supabase
      .from("clubs")
      .update({ balance: club.balance + data.amount })
      .eq("id", params.id);

    if (updateError) {
      throw new ApiError({
        message: "Erro ao atualizar saldo",
        code: "BALANCE_UPDATE_FAILED",
        details: updateError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Empréstimo realizado com sucesso",
      data: {
        amount: data.amount,
        interest_rate: interestRate,
        duration_months: data.duration_months,
        total_amount: totalAmount,
        new_balance: club.balance + data.amount,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao solicitar empréstimo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
