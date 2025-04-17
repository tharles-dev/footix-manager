import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

// Interfaces para os tipos de dados retornados pelo Supabase
interface ServerPlayer {
  id: string;
  name: string;
  contract: {
    salary: number;
    clause_value?: number;
    contract_start: string;
    contract_end: string;
  };
}

interface Club {
  id: string;
  name: string;
  user_id: string;
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

const rejectTransferRequestSchema = z.object({
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
    const { transferRequestId } = rejectTransferRequestSchema.parse(body);

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
          user_id
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
        message: "Você não tem permissão para rejeitar esta proposta",
        code: "FORBIDDEN",
      });
    }

    // 2. PROCESSAR A REJEIÇÃO

    // 2.1 Atualizar o status da proposta para "rejected"
    const { error: updateError } = await supabase
      .from("transfer_requests")
      .update({ status: "rejected" })
      .eq("id", transferRequestId);

    if (updateError) {
      console.error("Erro ao atualizar status da proposta:", updateError);
      throw new ApiError({
        message: "Erro ao processar a rejeição",
        code: "TRANSFER_REJECTION_FAILED",
      });
    }

    // 2.2 Criar notificação para o clube comprador
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: transferRequest.to_club.user_id,
        type: "transfer",
        title: "Proposta de transferência rejeitada",
        message: `${
          transferRequest.from_club.name
        } rejeitou sua proposta de ${transferRequest.amount.toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL",
          }
        )} por ${transferRequest.server_players.name}`,
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
        read: false,
      });

    if (notificationError) {
      console.error("Erro ao criar notificação:", notificationError);
      // Não vamos falhar a requisição por causa de um erro na notificação
    }

    return NextResponse.json({
      message: "Proposta rejeitada com sucesso",
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

    console.error("Erro ao processar rejeição de transferência:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
