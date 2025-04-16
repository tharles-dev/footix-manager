import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

const hirePlayerSchema = z.object({
  playerId: z.string(),
  salary: z.number().min(0),
  serverId: z.string(),
  clubId: z.string(),
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
    const { playerId, salary, serverId, clubId } = hirePlayerSchema.parse(body);

    // 1. VERIFICAÇÃO INICIAL

    // 1.1 Obter configurações do servidor
    const { data: serverConfig, error: serverError } = await supabase
      .from("servers")
      .select(
        "season, market_value_multiplier, min_player_salary_percentage, max_player_salary_percentage, salary_cap, transfer_window_open, auto_clause_percentage, allow_free_agent_signing_outside_window"
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
    if (
      !serverConfig.transfer_window_open &&
      !serverConfig.allow_free_agent_signing_outside_window
    ) {
      throw new ApiError({
        message: "Janela de transferências está fechada",
        code: "TRANSFER_WINDOW_CLOSED",
      });
    }

    // 1.2 Verificar se o jogador existe e está disponível
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

    if (player.club_id) {
      throw new ApiError({
        message: "Jogador já está contratado",
        code: "PLAYER_ALREADY_HIRED",
      });
    }

    // 1.3 Verificar se o clube tem saldo suficiente
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("id, balance, season_budget_base,  name")
      .eq("id", clubId)
      .eq("server_id", serverId)
      .single();

    if (clubError || !club) {
      throw new ApiError({
        message: "Clube não encontrado",
        code: "CLUB_NOT_FOUND",
      });
    }

    // 2. CÁLCULO DE VALORES

    // 2.1 Calcular valor de mercado baseado no salário e multiplicador do servidor
    const marketValue = salary * serverConfig.market_value_multiplier;

    // 2.2 Verificar se o salário está dentro dos limites permitidos
    const minSalary =
      player.base_salary * (serverConfig.min_player_salary_percentage / 100);
    const maxSalary =
      player.base_salary * (serverConfig.max_player_salary_percentage / 100);

    if (salary < minSalary || salary > maxSalary) {
      throw new ApiError({
        message: `Salário deve estar entre ${minSalary} e ${maxSalary}`,
        code: "INVALID_SALARY",
      });
    }

    // 2.3 Verificar se o clube tem saldo suficiente para pagar o valor de mercado
    if (club.balance < marketValue) {
      throw new ApiError({
        message: `Saldo insuficiente para contratar o jogador. Saldo atual: ${club.balance}, Valor necessário: ${marketValue}`,
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // 2.4 Verificar teto salarial do clube
    const { data: clubSalaries, error: salariesError } = await supabase
      .from("server_players")
      .select("contract")
      .eq("club_id", clubId)
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
      club.season_budget_base * (serverConfig.salary_cap / 100);
    const totalSalaries = currentTotalSalaries + salary;

    console.log(`salaryCapValue: ${salaryCapValue}`);
    console.log(`totalSalaries: ${totalSalaries}`);
    // Verificar se o novo salário excederia o teto
    if (totalSalaries > salaryCapValue) {
      throw new ApiError({
        message: "Contratação excederia o teto salarial do clube",
        code: "SALARY_CAP_EXCEEDED",
      });
    }

    // 3. PROCESSAMENTO DA TRANSAÇÃO

    // 3.1 Criar registro na tabela transfers
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .insert({
        server_id: serverId,
        player_id: playerId,
        from_club_id: null, // Jogador livre
        to_club_id: clubId,
        type: "free",
        amount: marketValue, // Valor de mercado normal
        status: "completed",
      })
      .select()
      .single();

    if (transferError) {
      console.error("Erro ao registrar transferência:", transferError);
      throw new ApiError({
        message: "Erro ao registrar transferência",
        code: "TRANSFER_REGISTRATION_FAILED",
      });
    }

    // 3.2 Atualizar o contrato do jogador na tabela server_players
    const contractData = {
      salary,
      clause_value: marketValue * (serverConfig.auto_clause_percentage / 100), // Usar porcentagem do servidor
      contract_start: new Date().toISOString(),
      contract_end: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      ).toISOString(),
    };

    const { error: playerUpdateError } = await supabase
      .from("server_players")
      .update({
        club_id: clubId,
        contract: contractData,
      })
      .eq("id", playerId)
      .eq("server_id", serverId);

    if (playerUpdateError) {
      console.error("Erro ao atualizar jogador:", playerUpdateError);
      throw new ApiError({
        message: "Erro ao atualizar jogador",
        code: "PLAYER_UPDATE_FAILED",
      });
    }

    // 3.3 Registrar a transação na tabela financial_transactions
    const { error: transactionError } = await supabase
      .from("financial_transactions")
      .insert({
        club_id: clubId,
        type: "expense",
        category: "player_salary",
        amount: marketValue,
        description: `Contratação de ${player.name} - 1 ano`,
        transaction_date: new Date().toISOString(),
      });

    if (transactionError) {
      console.error(
        "Erro ao registrar transação financeira:",
        transactionError
      );
      throw new ApiError({
        message: "Erro ao registrar transação financeira",
        code: "TRANSACTION_REGISTRATION_FAILED",
      });
    }

    // 4.2 Atualizar o saldo do clube
    const { error: balanceError } = await supabase
      .from("clubs")
      .update({
        balance: club.balance - marketValue,
      })
      .eq("id", clubId)
      .eq("server_id", serverId);

    if (balanceError) {
      console.error("Erro ao atualizar saldo:", balanceError);
      throw new ApiError({
        message: "Erro ao atualizar saldo do clube",
        code: "BALANCE_UPDATE_FAILED",
      });
    }

    return NextResponse.json({
      message: "Jogador contratado com sucesso",
      data: {
        player_id: playerId,
        club_id: clubId,
        transfer_id: transfer.id,
        salary,
        market_value: marketValue,
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
