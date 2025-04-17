import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

// Interfaces para os tipos de dados retornados pelo Supabase
interface PlayerContract {
  salary: number;
  clause_value?: number;
  contract_start: string;
  contract_end: string;
}

interface ServerPlayer {
  id: string;
  name: string;
  contract: PlayerContract;
}

interface Club {
  id: string;
  name: string;
  user_id: string;
  balance?: number;
}

interface TransferRequest {
  id: string;
  server_id: string;
  player_id: string;
  from_club_id: string;
  to_club_id: string;
  amount: number;
  status: string;
  created_at: string;
  server_players: ServerPlayer;
  from_club: Club;
  to_club: Club;
}

const acceptTransferRequestSchema = z.object({
  transferRequestId: z.string(),
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
    const { transferRequestId } = acceptTransferRequestSchema.parse(body);

    // 1. OBTER DADOS DA PROPOSTA DE TRANSFERÊNCIA

    const { data, error: transferRequestError } = await supabase
      .from("transfer_requests")
      .select(
        `
        id,
        server_id,
        player_id,
        from_club_id,
        to_club_id,
        amount,
        status,
        created_at,
        server_players (
          id,
          name,
          contract
        ),
        from_club:clubs!transfer_requests_from_club_id_fkey (
          id,
          name,
          user_id
        ),
        to_club:clubs!transfer_requests_to_club_id_fkey (
          id,
          name,
          user_id,
          balance
        )
      `
      )
      .eq("id", transferRequestId)
      .single();

    if (transferRequestError || !data) {
      throw new ApiError({
        message: "Proposta de transferência não encontrada",
        code: "TRANSFER_REQUEST_NOT_FOUND",
      });
    }

    const transferRequest = data as unknown as TransferRequest;

    // Verificar se a proposta já foi processada
    if (transferRequest.status !== "pending") {
      throw new ApiError({
        message: "Esta proposta já foi processada",
        code: "TRANSFER_REQUEST_ALREADY_PROCESSED",
      });
    }

    // Verificar se o usuário é dono do clube vendedor
    if (transferRequest.from_club.user_id !== user.id) {
      throw new ApiError({
        message: "Você não tem permissão para aceitar esta proposta",
        code: "FORBIDDEN",
      });
    }

    // 2. VERIFICAÇÕES ADICIONAIS

    // 2.1 Verificar se o clube comprador ainda tem saldo suficiente
    if (
      transferRequest.to_club.balance &&
      transferRequest.to_club.balance < transferRequest.amount
    ) {
      throw new ApiError({
        message:
          "O clube comprador não tem saldo suficiente para esta transferência",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // 2.2 Verificar se o jogador ainda pertence ao clube vendedor
    const { data: player, error: playerError } = await supabase
      .from("server_players")
      .select("club_id")
      .eq("id", transferRequest.player_id)
      .single();

    if (playerError || !player) {
      throw new ApiError({
        message: "Jogador não encontrado",
        code: "PLAYER_NOT_FOUND",
      });
    }

    if (player.club_id !== transferRequest.from_club_id) {
      throw new ApiError({
        message: "O jogador não pertence mais ao clube vendedor",
        code: "PLAYER_NOT_OWNED",
      });
    }

    // 3. PROCESSAR A TRANSFERÊNCIA

    // 3.1 Atualizar o status da proposta para "accepted"
    const { error: updateError } = await supabase
      .from("transfer_requests")
      .update({ status: "accepted" })
      .eq("id", transferRequestId);

    if (updateError) {
      console.error("Erro ao atualizar status da proposta:", updateError);
      throw new ApiError({
        message: "Erro ao processar a transferência",
        code: "TRANSFER_PROCESSING_FAILED",
      });
    }

    // O trigger process_transfer_request_acceptance() será acionado automaticamente
    // e irá:
    // - Atualizar o clube do jogador
    // - Transferir o dinheiro entre os clubes
    // - Registrar a transação financeira
    // - Criar notificações para os usuários envolvidos

    return NextResponse.json({
      message: "Transferência aceita com sucesso",
      data: {
        transfer_request_id: transferRequestId,
        player_id: transferRequest.player_id,
        player_name: transferRequest.server_players.name,
        from_club_id: transferRequest.from_club_id,
        from_club_name: transferRequest.from_club.name,
        to_club_id: transferRequest.to_club_id,
        to_club_name: transferRequest.to_club.name,
        amount: transferRequest.amount,
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

    console.error("Erro ao processar aceitação de transferência:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
