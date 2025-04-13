import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { addRevenueSchema } from "@/lib/api/schemas/club";

// GET /api/club/[id]/finance/budget/revenues
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-revenues", 30, 60); // 30 requisições por minuto

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

    // Busca receitas da temporada
    const { data: revenues } = await supabase
      .from("revenues")
      .select("*")
      .eq("club_id", params.id)
      .eq("season", new Date().getFullYear())
      .order("created_at", { ascending: false });

    return NextResponse.json({
      data: {
        revenues: revenues || [],
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar receitas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/club/[id]/finance/budget/revenues
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-revenue-add", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(addRevenueSchema, body);

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

    // Registra a receita
    const { data: revenue, error: revenueError } = await supabase
      .from("revenues")
      .insert({
        club_id: params.id,
        amount: data.amount,
        description: data.description,
        category: data.category,
        season: new Date().getFullYear(),
      })
      .select()
      .single();

    if (revenueError) {
      throw new ApiError({
        message: "Erro ao registrar receita",
        code: "REVENUE_CREATION_FAILED",
        details: revenueError,
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
      message: "Receita registrada com sucesso",
      data: {
        revenue_id: revenue.id,
        amount: data.amount,
        description: data.description,
        category: data.category,
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

    console.error("Erro ao registrar receita:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
