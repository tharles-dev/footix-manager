import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validar se é um admin
    const supabase = createServerClient(cookies());
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

    // Obter parâmetros de query
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const position = searchParams.get("position");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabase
      .from("server_players")
      .select(
        `
        id,
        name,
        position,
        overall,
        club:clubs!server_players_club_id_fkey (
          id,
          name,
          logo_url
        ),
        contract,
        transfer_availability
      `,
        { count: "exact" }
      )
      .eq("server_id", params.id)
      .eq("transfer_availability", "auction_only")
      .order("overall", { ascending: false });

    // Aplicar filtros adicionais
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (position) {
      query = query.eq("position", position);
    }

    // Executar query com paginação
    const {
      data: players,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Erro ao buscar jogadores:", error);
      return NextResponse.json(
        { error: "Erro ao buscar jogadores" },
        { status: 500 }
      );
    }

    // Mapear os jogadores para incluir o valor
    const playersWithValue = players?.map((player) => ({
      ...player,
      value: player.contract?.clause_value || 0,
    }));

    return NextResponse.json({
      data: playersWithValue,
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
