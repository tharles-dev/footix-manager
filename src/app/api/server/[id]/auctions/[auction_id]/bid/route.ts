import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";
import { z } from "zod";
import { validateBalance, checkSalaryCapWarning } from "@/lib/auction-utils";
import { ApiError } from "@/lib/api/error";

// Schema de validação para lance
const bidSchema = z.object({
  amount: z.number().positive("O lance deve ser um valor positivo"),
});

// Função para calcular o próximo lance possível (10% acima do lance atual)
const calculateNextBidAmount = (currentBid: number): number => {
  const increment = currentBid * 0.1;
  const nextBid = currentBid + increment;

  return Math.ceil(nextBid);
};

export async function POST(
  request: Request,
  { params }: { params: { id: string; auction_id: string } }
) {
  try {
    // Validar se o usuário está autenticado
    const supabase = createServerClient(cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError({
        message: "Não autorizado",
        code: "UNAUTHORIZED",
      });
    }

    // Obter e validar os dados da requisição
    const body = await request.json();
    const validationResult = bidSchema.safeParse(body);

    console.log(params);
    console.log(validationResult);

    if (!validationResult.success) {
      throw new ApiError({
        message: "Dados inválidos",
        code: "INVALID_DATA",
        details: validationResult.error.format(),
      });
    }

    const { amount } = validationResult.data;

    // Verificar se o leilão existe e está ativo
    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .select(
        `
        *,
        player:server_players(*),
        seller_club:clubs!auctions_seller_club_id_fkey(*),
        bids:auction_bids(*)
      `
      )
      .eq("id", params.auction_id)
      .eq("server_id", params.id)
      .single();

    if (auctionError || !auction) {
      throw new ApiError({
        message: "Leilão não encontrado",
        code: "AUCTION_NOT_FOUND",
      });
    }

    // Verificar se o leilão está ativo
    if (auction.status !== "active") {
      throw new ApiError({
        message: "Este leilão não está ativo",
        code: "AUCTION_NOT_ACTIVE",
      });
    }

    // Verificar se o lance é maior que o lance atual
    const minBidAmount =
      auction.bids && auction.bids.length > 0
        ? calculateNextBidAmount(auction.current_bid)
        : auction.starting_bid;

    if (amount <= minBidAmount) {
      throw new ApiError({
        message: `O lance deve ser maior que ${minBidAmount.toLocaleString(
          "pt-BR"
        )}`,
        code: "BID_TOO_LOW",
        details: { minBidAmount },
      });
    }

    // Verificar se o usuário tem um clube
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select(
        `
        *,
        players:server_players!server_players_club_id_fkey(
          *,
          contract
        )
      `
      )
      .eq("user_id", user.id)
      .eq("server_id", params.id)
      .single();

    if (clubError || !club) {
      console.log(clubError);
      throw new ApiError({
        message: "Você precisa ter um clube para dar lances",
        code: "CLUB_NOT_FOUND",
      });
    }

    // Verificar se o clube não é o vendedor
    if (auction.seller_club_id === club.id) {
      throw new ApiError({
        message: "Você não pode dar lances em seus próprios leilões",
        code: "OWN_AUCTION_BID",
      });
    }

    // Verificar se o clube não é o atual maior lance
    if (auction.current_bidder_id === club.id) {
      throw new ApiError({
        message: "Você já é o maior lance",
        code: "ALREADY_HIGHEST_BID",
      });
    }

    // Validações avançadas
    const userBids = auction.bids.filter(
      (bid: { club_id: string }) => bid.club_id === club.id
    );
    const currentBids = userBids.length;

    // Validação de saldo
    const balanceValidation = validateBalance(club, amount, currentBids);
    if (!balanceValidation) {
      throw new ApiError({
        message: "Saldo insuficiente para realizar o lance",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Verifica teto salarial (apenas para aviso)
    const salaryCapWarning = checkSalaryCapWarning(
      club,
      auction.player,
      amount
    );

    // Armazenar avisos para retornar na resposta
    interface Warning {
      message: string;
      projectedTotal?: number;
      difference?: number;
    }

    const warnings: Record<string, Warning> = {};

    if (salaryCapWarning.exceeds) {
      warnings.salaryCap = {
        message: "O salário projetado ultrapassa o teto salarial",
        projectedTotal: salaryCapWarning.projectedTotal,
        difference: salaryCapWarning.difference,
      };
    }

    // Iniciar transação
    const { error: transactionError } = await supabase.rpc(
      "place_auction_bid",
      {
        p_auction_id: params.auction_id,
        p_club_id: club.id,
        p_amount: amount,
        p_server_id: params.id,
      }
    );

    if (transactionError) {
      console.error("Erro ao dar lance:", transactionError);
      throw new ApiError({
        message: "Erro ao dar lance. Tente novamente mais tarde.",
        code: "TRANSACTION_ERROR",
        details: transactionError,
      });
    }

    // Buscar o histórico de lances atualizado
    const { data: bids, error: bidsError } = await supabase
      .from("auction_bids")
      .select(
        `
        id,
        bid_amount,
        created_at,
        club:clubs (
          id,
          name,
          logo_url
        )
      `
      )
      .eq("auction_id", params.auction_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (bidsError) {
      console.error("Erro ao buscar histórico de lances:", bidsError);
    }

    return NextResponse.json({
      success: true,
      message: "Lance realizado com sucesso",
      data: {
        current_bid: amount,
        current_bidder: {
          id: club.id,
          name: club.name,
        },
        bid_history: bids || [],
      },
      warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: getStatusCodeFromErrorCode(error.code) }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função auxiliar para determinar o código de status HTTP com base no código de erro
function getStatusCodeFromErrorCode(code: string): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "INVALID_DATA":
    case "BID_TOO_LOW":
    case "OWN_AUCTION_BID":
    case "ALREADY_HIGHEST_BID":
    case "INSUFFICIENT_BALANCE":
      return 400;
    case "AUCTION_NOT_FOUND":
    case "CLUB_NOT_FOUND":
      return 404;
    case "AUCTION_NOT_ACTIVE":
      return 403;
    case "TRANSACTION_ERROR":
      return 500;
    default:
      return 500;
  }
}
