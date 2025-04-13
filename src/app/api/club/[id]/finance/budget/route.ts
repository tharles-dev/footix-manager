import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { getCachedData, setCachedData, invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";
import { updateBudgetSchema } from "@/lib/api/schemas/club";

// GET /api/club/[id]/finance/budget
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-budget", 30, 60); // 30 requisições por minuto

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select(
        `
        id,
        season_budget_base,
        season_budget_bonus,
        season_expenses,
        ticket_price,
        season_ticket_price,
        season_ticket_holders,
        stadium_capacity
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

    // Busca despesas da temporada
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .eq("club_id", params.id)
      .eq("season", new Date().getFullYear())
      .order("created_at", { ascending: false });

    // Busca receitas da temporada
    const { data: revenues } = await supabase
      .from("revenues")
      .select("*")
      .eq("club_id", params.id)
      .eq("season", new Date().getFullYear())
      .order("created_at", { ascending: false });

    // Calcula totais
    const totalExpenses =
      expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
    const totalRevenues =
      revenues?.reduce((acc, rev) => acc + rev.amount, 0) || 0;
    const projectedTicketRevenue =
      club.ticket_price * club.stadium_capacity * 19; // 19 jogos em casa
    const projectedSeasonTicketRevenue =
      club.season_ticket_price * club.season_ticket_holders;

    return NextResponse.json({
      data: {
        budget: {
          base: club.season_budget_base,
          bonus: club.season_budget_bonus,
          total: club.season_budget_base + club.season_budget_bonus,
        },
        expenses: {
          total: totalExpenses,
          by_category:
            expenses?.reduce((acc, exp) => {
              acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
              return acc;
            }, {}) || {},
        },
        revenues: {
          total: totalRevenues,
          by_category:
            revenues?.reduce((acc, rev) => {
              acc[rev.category] = (acc[rev.category] || 0) + rev.amount;
              return acc;
            }, {}) || {},
        },
        projections: {
          ticket_revenue: projectedTicketRevenue,
          season_ticket_revenue: projectedSeasonTicketRevenue,
          total_revenue: projectedTicketRevenue + projectedSeasonTicketRevenue,
        },
        balance:
          club.season_budget_base +
          club.season_budget_bonus +
          totalRevenues -
          totalExpenses,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar orçamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/club/[id]/finance/budget
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-budget-update", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(updateBudgetSchema, body);

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

    // Atualiza o orçamento
    const { error: updateError } = await supabase
      .from("clubs")
      .update({
        season_budget_base: data.season_budget_base,
        season_budget_bonus: data.season_budget_bonus,
        ticket_price: data.ticket_price,
        season_ticket_price: data.season_ticket_price,
      })
      .eq("id", params.id);

    if (updateError) {
      throw new ApiError({
        message: "Erro ao atualizar orçamento",
        code: "BUDGET_UPDATE_FAILED",
        details: updateError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Orçamento atualizado com sucesso",
      data: {
        season_budget_base: data.season_budget_base,
        season_budget_bonus: data.season_budget_bonus,
        ticket_price: data.ticket_price,
        season_ticket_price: data.season_ticket_price,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar orçamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
