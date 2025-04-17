import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type AuctionStatus = "active" | "scheduled" | "completed";

interface Auction {
  status: AuctionStatus;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient(cookies());

    // Verificar se o usuário é admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário é admin
    const { data: adminData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminData || adminData.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar estatísticas dos leilões
    const { data: stats, error } = await supabase
      .from("auctions")
      .select("status", { count: "exact" })
      .eq("server_id", params.id)
      .in("status", ["active", "scheduled", "completed"]);

    if (error) {
      throw error;
    }

    // Processar as estatísticas
    const auctionStats = {
      active:
        stats?.filter((auction: Auction) => auction.status === "active")
          .length || 0,
      scheduled:
        stats?.filter((auction: Auction) => auction.status === "scheduled")
          .length || 0,
      completed:
        stats?.filter((auction: Auction) => auction.status === "completed")
          .length || 0,
    };

    return NextResponse.json({ data: auctionStats });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de leilões:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas de leilões" },
      { status: 500 }
    );
  }
}
