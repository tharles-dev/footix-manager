import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Inicializa Supabase
    const supabase = createServerClient(cookies());

    // Autenticação do usuário
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verifica se é admin
    const { data: adminData, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (adminError || !adminData || adminData.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Parâmetros de paginação e filtro
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const offset = (page - 1) * limit;
    const type = searchParams.get("type") || "all"; // 'all', 'scheduled' ou 'free'

    // 1) Conta total de players com auction_only
    const { count: totalCount, error: totalError } = await supabase
      .from("server_players")
      .select("id", { count: "exact", head: true })
      .eq("server_id", params.id)
      .eq("transfer_availability", "auction_only");
    if (totalError) throw totalError;

    // 2) Conta quantos players têm pelo menos um leilão agendado
    let scheduledCount = 0;
    if (type === "scheduled" || type === "free") {
      const { count: schedCount, error: schedError } = await supabase
        .from("auctions")
        .select("player_id", {
          count: "exact",
          head: true,
          // @ts-expect-error - O tipo do Supabase não inclui a propriedade 'count' no retorno da query
          distinct: "player_id",
        })
        .eq("server_id", params.id)
        .eq("status", "scheduled");
      if (schedError) throw schedError;
      scheduledCount = schedCount ?? 0;
    }

    // 3) Determina totalItems conforme tipo
    let totalItems: number;
    if (type === "scheduled") totalItems = scheduledCount;
    else if (type === "free") totalItems = (totalCount ?? 0) - scheduledCount;
    else totalItems = totalCount ?? 0;

    // Seleção dinâmica para INNER JOIN se necessário
    const auctionJoin =
      type === "scheduled"
        ? "auctions!inner!auctions_player_id_fkey"
        : "auctions!auctions_player_id_fkey";

    const selectStr = `
      *,
      club:clubs!server_players_club_id_fkey (
        id,
        name,
        logo_url
      ),
      ${auctionJoin} (
        id,
        status,
        scheduled_start_time,
        starting_bid,
        countdown_minutes
      )
    `;

    // Query principal com filtro correto
    let query = supabase
      .from("server_players")
      .select(selectStr)
      .eq("server_id", params.id)
      .eq("transfer_availability", "auction_only")
      .order("overall", { ascending: false });

    if (type === "scheduled") {
      query = query.eq("auctions.status", "scheduled");
    } else if (type === "free") {
      query = query.is("auctions.id", null);
    }

    // Paginação
    query = query.range(offset, offset + limit - 1);

    const { data: players, error: playersError } = await query;
    if (playersError) throw playersError;

    // Processamento final dos players
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedPlayers = (players || []).map((player: any) => {
      const hasScheduledAuction = player.auctions?.some(
        (a: { status: string }) => a.status === "scheduled"
      );
      const hasActiveAuction = player.auctions?.some(
        (a: { status: string }) => a.status === "active"
      );
      let auctionStatus = "free";
      if (hasScheduledAuction) auctionStatus = "scheduled";
      else if (hasActiveAuction) auctionStatus = "active";

      const latestAuction = player.auctions?.length
        ? player.auctions.reduce(
            (
              latest: { scheduled_start_time: string },
              current: { scheduled_start_time: string }
            ) =>
              new Date(current.scheduled_start_time) >
              new Date(latest.scheduled_start_time)
                ? current
                : latest
          )
        : null;

      return {
        ...player,
        value: player.contract?.clause_value ?? 0,
        has_scheduled_auction: hasScheduledAuction,
        has_active_auction: hasActiveAuction,
        auction_status: auctionStatus,
        auction: latestAuction,
      };
    });

    return NextResponse.json({
      data: processedPlayers,
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit),
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
