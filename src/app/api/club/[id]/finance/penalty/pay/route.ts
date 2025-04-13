import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { payPenaltySchema } from "@/lib/api/schemas/club";

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
