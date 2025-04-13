import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { addExpenseSchema } from "@/lib/api/schemas/club";

// GET /api/club/[id]/finance/budget/expenses
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-expenses", 30, 60); // 30 requisições por minuto

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

    // Busca despesas da temporada
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("club_id", params.id)
      .eq("season", new Date().getFullYear())
      .order("created_at", { ascending: false });

    return NextResponse.json({
      data: {
        expenses: expenses || [],
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar despesas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/club/[id]/finance/budget/expenses
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-expense-add", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(addExpenseSchema, body);

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

    // Verifica se o clube tem saldo suficiente
    if (club.balance < data.amount) {
      throw new ApiError({
        message: "Saldo insuficiente para registrar a despesa",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Registra a despesa
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        club_id: params.id,
        amount: data.amount,
        description: data.description,
        category: data.category,
        season: new Date().getFullYear(),
      })
      .select()
      .single();

    if (expenseError) {
      throw new ApiError({
        message: "Erro ao registrar despesa",
        code: "EXPENSE_CREATION_FAILED",
        details: expenseError,
      });
    }

    // Atualiza o saldo do clube
    const { error: balanceError } = await supabase
      .from("clubs")
      .update({ balance: club.balance - data.amount })
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
      message: "Despesa registrada com sucesso",
      data: {
        expense_id: expense.id,
        amount: data.amount,
        description: data.description,
        category: data.category,
        new_balance: club.balance - data.amount,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao registrar despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
