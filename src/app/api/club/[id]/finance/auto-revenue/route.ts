import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";

// POST /api/club/[id]/finance/auto-revenue
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("club-finance-auto-revenue", 5, 60); // 5 requisições por minuto

    // Verifica se o clube existe e pertence ao usuário
    const { data: club } = await supabase
      .from("clubs")
      .select(
        `
        id, 
        balance, 
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
      .select("enable_monetization")
      .eq("id", club.server_id)
      .single();

    if (!server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    if (!server.enable_monetization) {
      throw new ApiError({
        message: "Monetização não está habilitada neste servidor",
        code: "MONETIZATION_DISABLED",
      });
    }

    // Calcula receita de ingressos
    const averageAttendance = Math.floor(club.stadium_capacity * 0.7); // 70% de ocupação média
    const ticketRevenue = averageAttendance * club.ticket_price;

    // Calcula receita de sócios
    const seasonTicketRevenue =
      club.season_ticket_holders * club.ticket_price * 5; // 5x o valor do ingresso

    // Calcula receita de merchandising
    const merchandisingRevenue = Math.floor(
      club.fan_base * 0.1 * club.ticket_price * 0.5
    ); // 10% dos torcedores compram, 50% do valor do ingresso

    // Calcula receita de patrocínios
    const sponsorshipRevenue = Math.floor(club.reputation * 10000); // 10.000 por ponto de reputação

    // Registra receitas
    const season = new Date().getFullYear();
    const revenues = [
      {
        club_id: params.id,
        amount: ticketRevenue,
        description: "Receita de ingressos",
        category: "ticket_sales",
        season,
      },
      {
        club_id: params.id,
        amount: seasonTicketRevenue,
        description: "Receita de sócios",
        category: "ticket_sales",
        season,
      },
      {
        club_id: params.id,
        amount: merchandisingRevenue,
        description: "Receita de merchandising",
        category: "merchandise",
        season,
      },
      {
        club_id: params.id,
        amount: sponsorshipRevenue,
        description: "Receita de patrocínios",
        category: "sponsorship",
        season,
      },
    ];

    // Insere receitas
    const { error: insertError } = await supabase
      .from("revenues")
      .insert(revenues);

    if (insertError) {
      throw new ApiError({
        message: "Erro ao registrar receitas automáticas",
        code: "REVENUE_REGISTRATION_FAILED",
        details: insertError,
      });
    }

    // Atualiza saldo do clube
    const totalRevenue =
      ticketRevenue +
      seasonTicketRevenue +
      merchandisingRevenue +
      sponsorshipRevenue;
    const { error: updateError } = await supabase
      .from("clubs")
      .update({ balance: club.balance + totalRevenue })
      .eq("id", params.id);

    if (updateError) {
      throw new ApiError({
        message: "Erro ao atualizar saldo do clube",
        code: "BALANCE_UPDATE_FAILED",
        details: updateError,
      });
    }

    // Invalida cache
    await invalidateCache(`club:${params.id}:finance`);

    return NextResponse.json({
      message: "Receitas automáticas registradas com sucesso",
      data: {
        ticket_revenue: ticketRevenue,
        season_ticket_revenue: seasonTicketRevenue,
        merchandising_revenue: merchandisingRevenue,
        sponsorship_revenue: sponsorshipRevenue,
        total_revenue: totalRevenue,
        new_balance: club.balance + totalRevenue,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao registrar receitas automáticas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
