import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";

export async function GET(
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
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar detalhes do leilão
    const { data: auction, error } = await supabase
      .from("auctions")
      .select(
        `
        *,
        player:server_players (
          id,
          name,
          position,
          overall,
          nationality,
          age,
          potential,
          club:clubs!server_players_club_id_fkey (
            id,
            name,
            logo_url
          )
        ),
        seller_club:clubs!seller_club_id (
          id,
          name,
          logo_url
        ),
        current_bidder:clubs!current_bidder_id (
          id,
          name,
          logo_url
        ),
        bids:auction_bids (
          id,
          bid_amount,
          created_at,
          club:clubs (
            id,
            name,
            logo_url
          )
        )
      `
      )
      .eq("id", params.auction_id)
      .eq("server_id", params.id)
      .single();

    if (error) {
      console.error("Erro ao buscar leilão:", error);
      return NextResponse.json(
        { error: "Leilão não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: auction });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
