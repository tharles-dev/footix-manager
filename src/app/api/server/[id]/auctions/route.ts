import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Obter parâmetros de query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
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
      .eq("server_id", params.id)
      .order("created_at", { ascending: false });

    // Aplicar filtro de status se fornecido
    if (status) {
      query = query.eq("status", status);
    }

    // Executar query com paginação
    const { data: auctions, error } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      console.error("Erro ao buscar leilões:", error);
      return NextResponse.json(
        { error: "Erro ao buscar leilões" },
        { status: 500 }
      );
    }

    // Obter contagem total de leilões
    let countQuery = supabase
      .from("auctions")
      .select("*", { count: "exact", head: true })
      .eq("server_id", params.id);

    // Aplicar filtro de status se fornecido
    if (status) {
      countQuery = countQuery.eq("status", status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      data: auctions,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
