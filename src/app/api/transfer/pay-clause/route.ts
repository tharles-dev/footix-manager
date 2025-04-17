import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

const payClauseSchema = z.object({
  player_id: z.string().uuid(),
  club_id: z.string().uuid(),
  server_id: z.string().uuid(),
  amount: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError({
        message: "Não autorizado",
        code: "UNAUTHORIZED",
      });
    }

    // Validar corpo da requisição
    const body = await request.json();
    const { player_id, club_id, amount, server_id } =
      payClauseSchema.parse(body);

    // Buscar configurações do servidor
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("market_value_multiplier, salary_cap")
      .eq("id", server_id)
      .single();

    if (serverError || !server) {
      throw new ApiError({
        message: "Configurações do servidor não encontradas",
        code: "SERVER_NOT_FOUND",
      });
    }

    // Buscar jogador
    const { data: player, error: playerError } = await supabase
      .from("server_players")
      .select("id, name, contract")
      .eq("id", player_id)
      .eq("server_id", server_id)
      .single();

    if (playerError || !player) {
      throw new ApiError({
        message: "Jogador não encontrado",
        code: "PLAYER_NOT_FOUND",
      });
    }

    // Verificar se o jogador tem contrato
    if (!player.contract) {
      throw new ApiError({
        message: "Jogador não possui contrato",
        code: "NO_CONTRACT",
      });
    }

    // Verificar se o clube pertence ao usuário
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("id, balance, name, season_budget_base")
      .eq("id", club_id)
      .eq("user_id", user.id)
      .eq("server_id", server_id)
      .single();

    if (clubError || !club) {
      throw new ApiError({
        message: "Clube não encontrado ou não pertence ao usuário",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Verificar se o clube tem saldo suficiente
    if (club.balance < amount) {
      throw new ApiError({
        message: "Saldo insuficiente",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Calcular o salário baseado no valor da multa
    const estimatedSalary = amount / server.market_value_multiplier;

    // Calcular o teto salarial do clube
    const salaryCap = club.season_budget_base * (server.salary_cap / 100);

    // Buscar total de salários atuais do clube
    const { data: currentSalaries, error: salariesError } = await supabase
      .from("server_players")
      .select("contract")
      .eq("club_id", club_id)
      .eq("server_id", server_id);

    if (salariesError) {
      throw new ApiError({
        message: "Erro ao verificar salários do clube",
        code: "SALARY_CHECK_FAILED",
      });
    }

    // Calcular total de salários atuais
    const currentTotalSalaries = currentSalaries.reduce((total, player) => {
      return total + (player.contract?.salary || 0);
    }, 0);

    // Verificar se o novo salário excederia o teto
    if (currentTotalSalaries + estimatedSalary > salaryCap) {
      throw new ApiError({
        message: `Contratação excederia o teto salarial do clube. Teto: ${salaryCap}, Salários atuais: ${currentTotalSalaries}, Novo salário estimado: ${estimatedSalary}`,
        code: "SALARY_CAP_EXCEEDED",
      });
    }

    // Processar pagamento da multa
    const { error: payError } = await supabase.rpc("pay_clause", {
      p_player_id: player_id,
      p_club_id: club_id,
      p_server_id: server_id,
      p_amount: amount,
    });

    if (payError) {
      throw new ApiError({
        message: payError.message,
        code: "PAYMENT_FAILED",
      });
    }

    return NextResponse.json({
      message: "Multa rescisória paga com sucesso",
      data: {
        player_id,
        player_name: player.name,
        club_id,
        club_name: club.name,
        amount,
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

    console.error("Erro ao processar pagamento de multa:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
