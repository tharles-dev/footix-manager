import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { requestLoanSchema, payLoanSchema } from "@/lib/api/schemas/club";

// GET /api/club/[id]/finance/loan
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-loan", 30, 60); // 30 requisições por minuto

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id, reputation, balance")
      .eq("id", params.id)
      .eq("user_id", request.headers.get("user-id"))
      .single();

    if (!club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence a você",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Busca empréstimos ativos
    const { data: loans } = await supabase
      .from("loans")
      .select("*")
      .eq("club_id", params.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      data: {
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

    console.error("Erro ao buscar empréstimos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/club/[id]/finance/loan
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-loan-request", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(requestLoanSchema, body);

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select("id, reputation, balance")
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
      .select("id")
      .eq("club_id", params.id)
      .eq("status", "active");

    if (activeLoans && activeLoans.length > 0) {
      throw new ApiError({
        message: "Clube já possui empréstimos ativos",
        code: "ACTIVE_LOANS_EXIST",
      });
    }

    // Calcula taxa de juros baseada na reputação
    const interestRate = Math.max(
      0.05,
      Math.min(0.15, 0.15 - club.reputation / 1000)
    );
    const totalAmount =
      data.amount * (1 + interestRate * (data.duration_months / 12));
    const monthlyPayment = totalAmount / data.duration_months;

    // Cria o empréstimo
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .insert({
        club_id: params.id,
        amount: data.amount,
        interest_rate: interestRate,
        total_amount: totalAmount,
        monthly_payment: monthlyPayment,
        duration_months: data.duration_months,
        remaining_months: data.duration_months,
        status: "active",
      })
      .select()
      .single();

    if (loanError) {
      throw new ApiError({
        message: "Erro ao criar empréstimo",
        code: "LOAN_CREATION_FAILED",
        details: loanError,
      });
    }

    // Atualiza o saldo do clube
    const { error: balanceError } = await supabase
      .from("clubs")
      .update({ balance: club.balance + data.amount })
      .eq("id", params.id);

    if (balanceError) {
      throw new ApiError({
        message: "Erro ao atualizar saldo",
        code: "BALANCE_UPDATE_FAILED",
        details: balanceError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Empréstimo solicitado com sucesso",
      data: {
        loan_id: loan.id,
        amount: data.amount,
        interest_rate: interestRate,
        total_amount: totalAmount,
        monthly_payment: monthlyPayment,
        duration_months: data.duration_months,
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

// POST /api/club/[id]/finance/loan/pay
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-loan-pay", 5, 60); // 5 requisições por minuto

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
        message: "Empréstimo não encontrado ou já pago",
        code: "LOAN_NOT_FOUND",
      });
    }

    // Verifica se o clube tem saldo suficiente
    if (club.balance < loan.total_amount) {
      throw new ApiError({
        message: "Saldo insuficiente para pagar o empréstimo",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Atualiza o saldo e o status do empréstimo
    const { error: updateError } = await supabase
      .from("clubs")
      .update({ balance: club.balance - loan.total_amount })
      .eq("id", params.id);

    if (updateError) {
      throw new ApiError({
        message: "Erro ao atualizar saldo",
        code: "BALANCE_UPDATE_FAILED",
        details: updateError,
      });
    }

    const { error: loanError } = await supabase
      .from("loans")
      .update({ status: "paid" })
      .eq("id", data.loan_id);

    if (loanError) {
      throw new ApiError({
        message: "Erro ao atualizar status do empréstimo",
        code: "LOAN_UPDATE_FAILED",
        details: loanError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Empréstimo pago com sucesso",
      data: {
        loan_id: data.loan_id,
        amount: loan.total_amount,
        new_balance: club.balance - loan.total_amount,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao pagar empréstimo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
