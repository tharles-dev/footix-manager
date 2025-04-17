import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

const transferRequestSchema = z.object({
  playerId: z.string(),
  amount: z.number().min(0),
  serverId: z.string(),
  fromClubId: z.string(),
  toClubId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError({
        message: "Não autorizado",
        code: "UNAUTHORIZED",
      });
    }

    // Validar dados da requisição
    const body = await request.json();
    const { playerId, amount, serverId, fromClubId, toClubId } =
      transferRequestSchema.parse(body);

    // 1. VERIFICAÇÃO INICIAL

    // 1.1 Obter configurações do servidor
    const { data: serverConfig, error: serverError } = await supabase
      .from("servers")
      .select(
        "season, market_value_multiplier, min_player_salary_percentage, max_player_salary_percentage, salary_cap, transfer_window_open"
      )
      .eq("id", serverId)
      .single();

    if (serverError || !serverConfig) {
      console.error("Erro ao obter configurações do servidor:", serverError);
      throw new ApiError({
        message: "Configurações do servidor não encontradas",
        code: "SERVER_CONFIG_NOT_FOUND",
      });
    }

    // Verificar se a janela de transferências está aberta
    if (!serverConfig.transfer_window_open) {
      throw new ApiError({
        message: "Janela de transferências está fechada",
        code: "TRANSFER_WINDOW_CLOSED",
      });
    }

    // 1.2 Verificar se o jogador existe e pertence ao clube vendedor
    const { data: player, error: playerError } = await supabase
      .from("server_players")
      .select("*")
      .eq("id", playerId)
      .eq("server_id", serverId)
      .single();

    if (playerError || !player) {
      throw new ApiError({
        message: "Jogador não encontrado",
        code: "PLAYER_NOT_FOUND",
      });
    }

    if (player.club_id !== fromClubId) {
      throw new ApiError({
        message: "O jogador não pertence ao clube vendedor",
        code: "PLAYER_NOT_OWNED",
      });
    }

    // 1.3 Verificar se o clube comprador não está tentando comprar seus próprios jogadores
    if (fromClubId === toClubId) {
      throw new ApiError({
        message:
          "Não é possível fazer oferta para jogadores do seu próprio clube",
        code: "SELF_TRANSFER_NOT_ALLOWED",
      });
    }

    // 1.4 Verificar se já existe uma oferta pendente para o mesmo jogador
    const { data: existingOffers, error: existingOffersError } = await supabase
      .from("transfer_requests")
      .select("id, status")
      .eq("player_id", playerId)
      .eq("to_club_id", toClubId)
      .eq("status", "pending");

    if (existingOffersError) {
      throw new ApiError({
        message: "Erro ao verificar ofertas existentes",
        code: "EXISTING_OFFERS_CHECK_FAILED",
      });
    }

    if (existingOffers && existingOffers.length > 0) {
      throw new ApiError({
        message: "Você já possui uma oferta pendente para este jogador",
        code: "DUPLICATE_OFFER",
      });
    }

    // 1.5 Verificar se o clube comprador tem saldo suficiente
    const { data: toClub, error: toClubError } = await supabase
      .from("clubs")
      .select("id, balance, season_budget_base, name")
      .eq("id", toClubId)
      .eq("server_id", serverId)
      .single();

    if (toClubError || !toClub) {
      throw new ApiError({
        message: "Clube comprador não encontrado",
        code: "TO_CLUB_NOT_FOUND",
      });
    }

    // Verificar todas as ofertas pendentes do clube comprador
    const { data: pendingOffers, error: pendingOffersError } = await supabase
      .from("transfer_requests")
      .select("amount")
      .eq("to_club_id", toClubId)
      .eq("status", "pending");

    if (pendingOffersError) {
      throw new ApiError({
        message: "Erro ao verificar ofertas pendentes",
        code: "PENDING_OFFERS_CHECK_FAILED",
      });
    }

    // Calcular o total de ofertas pendentes
    const totalPendingOffers = pendingOffers.reduce(
      (total, offer) => total + offer.amount,
      0
    );

    // Verificar se o clube tem saldo suficiente considerando todas as ofertas pendentes
    if (toClub.balance < amount + totalPendingOffers) {
      throw new ApiError({
        message: `Saldo insuficiente para a proposta. Saldo atual: ${toClub.balance}, Total de ofertas pendentes: ${totalPendingOffers}, Valor da nova proposta: ${amount}`,
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // 1.6 Verificar se o clube vendedor existe
    const { data: fromClub, error: fromClubError } = await supabase
      .from("clubs")
      .select("id, name, user_id")
      .eq("id", fromClubId)
      .eq("server_id", serverId)
      .single();

    if (fromClubError || !fromClub) {
      throw new ApiError({
        message: "Clube vendedor não encontrado",
        code: "FROM_CLUB_NOT_FOUND",
      });
    }

    // 2. CÁLCULO DE VALORES

    // 2.1 Verificar teto salarial do clube comprador
    const { data: clubSalaries, error: salariesError } = await supabase
      .from("server_players")
      .select("contract")
      .eq("club_id", toClubId)
      .eq("server_id", serverId);

    if (salariesError) {
      throw new ApiError({
        message: "Erro ao verificar salários do clube",
        code: "SALARY_CHECK_FAILED",
      });
    }

    // Calcular total de salários atuais
    const currentTotalSalaries = clubSalaries.reduce((total, player) => {
      return total + (player.contract?.salary || 0);
    }, 0);

    const salaryCapValue =
      toClub.season_budget_base * (serverConfig.salary_cap / 100);
    const playerSalary = amount / serverConfig.market_value_multiplier || 24;
    const totalSalaries = currentTotalSalaries + playerSalary;

    // Verificar se o novo salário excederia o teto
    if (totalSalaries > salaryCapValue) {
      throw new ApiError({
        message: `Contratação excederia o teto salarial do clube. Teto: ${salaryCapValue}, Salários atuais: ${currentTotalSalaries}, Novo salário: ${playerSalary}`,
        code: "SALARY_CAP_EXCEEDED",
      });
    }

    // 3. PROCESSAMENTO DA PROPOSTA

    // 3.1 Criar registro na tabela transfer_requests
    const { data: transferRequest, error: transferRequestError } =
      await supabase
        .from("transfer_requests")
        .insert({
          server_id: serverId,
          player_id: playerId,
          from_club_id: fromClubId,
          to_club_id: toClubId,
          amount: amount,
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (transferRequestError) {
      console.error("Erro ao registrar proposta:", transferRequestError);
      throw new ApiError({
        message: "Erro ao registrar proposta",
        code: "TRANSFER_REQUEST_REGISTRATION_FAILED",
      });
    }

    // 3.2 Criar notificação para o clube vendedor
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: fromClub.user_id,
        type: "transfer",
        title: "Nova proposta de transferência",
        message: `${toClub.name} ofereceu ${amount.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })} por ${player.name}`,
        data: {
          transfer_request_id: transferRequest.id,
          player_id: playerId,
          player_name: player.name,
          from_club_id: fromClubId,
          from_club_name: fromClub.name,
          to_club_id: toClubId,
          to_club_name: toClub.name,
          amount: amount,
        },
        read: false,
      });

    if (notificationError) {
      console.error("Erro ao criar notificação:", notificationError);
      // Não vamos falhar a requisição por causa de um erro na notificação
    }

    return NextResponse.json({
      message: "Proposta enviada com sucesso",
      data: {
        transfer_request_id: transferRequest.id,
        player_id: playerId,
        player_name: player.name,
        from_club_id: fromClubId,
        from_club_name: fromClub.name,
        to_club_id: toClubId,
        to_club_name: toClub.name,
        amount: amount,
        status: "pending",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
