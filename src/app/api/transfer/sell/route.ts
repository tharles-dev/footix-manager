import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sellPlayerSchema } from "@/lib/api/schemas/club";
import { validateData } from "@/lib/api/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { invalidateCache } from "@/lib/api/cache";
import { ApiError } from "@/lib/api/error";

import { cookies } from "next/headers";

const cookieStore = cookies();
const supabase = createServerClient(cookieStore);

export async function POST(request: Request) {
  try {
    // Verifica rate limit
    await checkRateLimit("transfer-sell", 5, 60); // 5 requisições por minuto

    // Obtém e valida os dados
    const body = await request.json();
    const data = validateData(sellPlayerSchema, body);

    // Verifica se o jogador existe e pertence ao clube vendedor
    const { data: player, error: playerError } = await supabase
      .from("server_players")
      .select("id, name, club_id, contract")
      .eq("id", data.player_id)
      .single();

    if (playerError || !player) {
      throw new ApiError({
        message: "Jogador não encontrado",
        code: "PLAYER_NOT_FOUND",
      });
    }

    // Verifica se o jogador pertence ao clube vendedor
    const sellerClubId = request.headers.get("club-id");
    if (player.club_id !== sellerClubId) {
      throw new ApiError({
        message: "Jogador não pertence ao seu clube",
        code: "PLAYER_NOT_OWNED",
      });
    }

    // Verifica se o clube comprador existe
    const { data: buyerClub, error: buyerError } = await supabase
      .from("clubs")
      .select("id, balance")
      .eq("id", data.buyer_club_id)
      .single();

    if (buyerError || !buyerClub) {
      throw new ApiError({
        message: "Clube comprador não encontrado",
        code: "BUYER_CLUB_NOT_FOUND",
      });
    }

    // Verifica se o clube comprador tem saldo suficiente
    if (buyerClub.balance < data.price) {
      throw new ApiError({
        message: "Clube comprador não tem saldo suficiente",
        code: "INSUFFICIENT_BUYER_BALANCE",
      });
    }

    // Verifica se o jogador está em empréstimo
    if (player.contract?.is_on_loan) {
      throw new ApiError({
        message: "Não é possível vender um jogador emprestado",
        code: "PLAYER_ON_LOAN",
      });
    }

    // Inicia a transação
    const { error: transactionError } = await supabase.rpc("sell_player", {
      p_player_id: data.player_id,
      p_seller_club_id: sellerClubId,
      p_buyer_club_id: data.buyer_club_id,
      p_price: data.price,
    });

    if (transactionError) {
      throw new ApiError({
        message: "Erro ao vender jogador",
        code: "SELL_PLAYER_FAILED",
        details: transactionError,
      });
    }

    // Invalida caches
    await Promise.all([
      invalidateCache(`club:${sellerClubId}`),
      invalidateCache(`club:${data.buyer_club_id}`),
      invalidateCache(`player:${data.player_id}`),
    ]);

    return NextResponse.json({
      message: "Jogador vendido com sucesso",
      data: {
        player_id: data.player_id,
        seller_club_id: sellerClubId,
        buyer_club_id: data.buyer_club_id,
        price: data.price,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao vender jogador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
