import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";

// GET /api/club/[id]/finance/report
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-report", 30, 60); // 30 requisições por minuto

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select(
        `
        id, 
        name,
        balance, 
        season_budget_base, 
        season_budget_bonus, 
        season_expenses,
        reputation,
        fan_base,
        stadium_capacity,
        ticket_price,
        season_ticket_holders,
        server_id
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

    // Busca configurações do servidor
    const { data: server } = await supabase
      .from("servers")
      .select("budget_growth_per_season, enable_monetization")
      .eq("id", club.server_id)
      .single();

    if (!server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    // Busca despesas da temporada atual
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount, category, description, created_at")
      .eq("club_id", params.id)
      .eq("season", new Date().getFullYear())
      .order("created_at", { ascending: false });

    // Busca receitas da temporada atual
    const { data: revenues } = await supabase
      .from("revenues")
      .select("amount, category, description, created_at")
      .eq("club_id", params.id)
      .eq("season", new Date().getFullYear())
      .order("created_at", { ascending: false });

    // Busca multas da temporada atual
    const { data: penalties } = await supabase
      .from("penalties")
      .select("amount, type, status, description, created_at")
      .eq("club_id", params.id)
      .eq("season", new Date().getFullYear())
      .order("created_at", { ascending: false });

    // Busca empréstimos ativos
    const { data: loans } = await supabase
      .from("loans")
      .select(
        "amount, interest_rate, total_amount, monthly_payment, duration_months, remaining_months, status, created_at"
      )
      .eq("club_id", params.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    // Busca jogadores para calcular salários
    const { data: players } = await supabase
      .from("server_players")
      .select("id, name, contract")
      .eq("club_id", params.id)
      .not("is_on_loan", "eq", true)
      .order("contract->salary", { ascending: false });

    // Calcula total de salários
    const totalSalaries =
      players?.reduce((total, player) => {
        return total + (player.contract?.salary || 0);
      }, 0) || 0;

    // Calcula despesas por categoria
    const expensesByCategory =
      expenses?.reduce((acc, expense) => {
        const category = expense.category || "other";
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>) || {};

    // Calcula receitas por categoria
    const revenuesByCategory =
      revenues?.reduce((acc, revenue) => {
        const category = revenue.category || "other";
        acc[category] = (acc[category] || 0) + revenue.amount;
        return acc;
      }, {} as Record<string, number>) || {};

    // Calcula total de despesas
    const totalExpenses =
      expenses?.reduce((total, expense) => total + expense.amount, 0) || 0;

    // Calcula total de receitas
    const totalRevenues =
      revenues?.reduce((total, revenue) => total + revenue.amount, 0) || 0;

    // Calcula total de multas
    const totalPenalties =
      penalties?.reduce((total, penalty) => total + penalty.amount, 0) || 0;

    // Calcula total de empréstimos
    const totalLoans =
      loans?.reduce((total, loan) => total + loan.amount, 0) || 0;

    // Calcula total de parcelas restantes de empréstimos
    const totalRemainingPayments =
      loans?.reduce((total, loan) => {
        return total + loan.monthly_payment * loan.remaining_months;
      }, 0) || 0;

    // Calcula projeções de receita com ingressos
    const averageAttendance = Math.floor(club.stadium_capacity * 0.7); // 70% de ocupação média
    const projectedTicketRevenue = averageAttendance * club.ticket_price * 19; // 19 jogos em casa
    const projectedSeasonTicketRevenue =
      club.season_ticket_holders * club.ticket_price * 5; // 5x o valor do ingresso

    // Calcula projeção de orçamento para próxima temporada
    const nextSeasonBudget =
      club.season_budget_base * (1 + server.budget_growth_per_season);

    // Calcula projeção de saldo
    const projectedBalance = club.balance + totalRevenues - totalExpenses;

    // Gera relatório financeiro
    const report = {
      club: {
        id: club.id,
        name: club.name,
        reputation: club.reputation,
        fan_base: club.fan_base,
        stadium_capacity: club.stadium_capacity,
        ticket_price: club.ticket_price,
        season_ticket_holders: club.season_ticket_holders,
      },
      current_season: {
        budget: {
          base: club.season_budget_base,
          bonus: club.season_budget_bonus,
          total: club.season_budget_base + club.season_budget_bonus,
        },
        expenses: {
          total: totalExpenses,
          by_category: expensesByCategory,
          salaries: totalSalaries,
          details: expenses?.slice(0, 10) || [], // Top 10 despesas
        },
        revenues: {
          total: totalRevenues,
          by_category: revenuesByCategory,
          details: revenues?.slice(0, 10) || [], // Top 10 receitas
        },
        penalties: {
          total: totalPenalties,
          details: penalties || [],
        },
        balance: club.balance,
      },
      loans: {
        active: loans?.length || 0,
        total_amount: totalLoans,
        remaining_payments: totalRemainingPayments,
        details: loans || [],
      },
      salary: {
        total: totalSalaries,
        top_players:
          players?.slice(0, 5).map((player) => ({
            id: player.id,
            name: player.name,
            salary: player.contract?.salary || 0,
          })) || [],
      },
      projections: {
        ticket_revenue: projectedTicketRevenue,
        season_ticket_revenue: projectedSeasonTicketRevenue,
        total_projected_revenue:
          projectedTicketRevenue + projectedSeasonTicketRevenue,
        next_season_budget: nextSeasonBudget,
        projected_balance: projectedBalance,
      },
    };

    return NextResponse.json({
      data: report,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao gerar relatório financeiro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
