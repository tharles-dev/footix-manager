import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { payLoanSchema } from "@/lib/api/schemas/club";

// POST /api/club/[id]/finance/loan/pay
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-loan-pay", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(payLoanSchema, body);

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

    // Busca o empréstimo
    const { data: loan } = await supabase
      .from("loans")
      .select("*")
      .eq("id", data.loan_id)
      .eq("club_id", params.id)
      .eq("status", "active")
      .single();

    if (!loan) {
      throw new ApiError({
        message: "Empréstimo não encontrado ou já quitado",
        code: "LOAN_NOT_FOUND",
      });
    }

    // Verifica se o clube tem saldo suficiente
    if (club.balance < loan.monthly_payment) {
      throw new ApiError({
        message: "Saldo insuficiente para pagar a parcela",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Atualiza o saldo e o status do empréstimo
    const { error: balanceError } = await supabase
      .from("clubs")
      .update({ balance: club.balance - loan.monthly_payment })
      .eq("id", params.id);

    if (balanceError) {
      throw new ApiError({
        message: "Erro ao atualizar saldo",
        code: "BALANCE_UPDATE_FAILED",
        details: balanceError,
      });
    }

    // Atualiza o empréstimo
    const remainingMonths = loan.remaining_months - 1;
    const { error: loanError } = await supabase
      .from("loans")
      .update({
        remaining_months: remainingMonths,
        status: remainingMonths === 0 ? "paid" : "active",
      })
      .eq("id", data.loan_id);

    if (loanError) {
      throw new ApiError({
        message: "Erro ao atualizar empréstimo",
        code: "LOAN_UPDATE_FAILED",
        details: loanError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Parcela paga com sucesso",
      data: {
        loan_id: data.loan_id,
        payment: loan.monthly_payment,
        remaining_months: remainingMonths,
        new_balance: club.balance - loan.monthly_payment,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao pagar parcela:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
