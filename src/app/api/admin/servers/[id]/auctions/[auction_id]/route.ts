import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema de validação para atualização de leilão
const updateAuctionSchema = z.object({
  starting_bid: z
    .number()
    .min(100000, "Lance inicial deve ser pelo menos 100.000"),
  scheduled_start_time: z.string().datetime(),
  countdown_minutes: z
    .number()
    .min(1, "O tempo deve ser pelo menos 1 minuto")
    .max(1440, "O tempo máximo é de 24 horas (1440 minutos)"),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string; auction_id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verificar se o usuário está autenticado
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

    // Obter e validar os dados da requisição
    const body = await request.json();
    const validationResult = updateAuctionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { starting_bid, scheduled_start_time, countdown_minutes } =
      validationResult.data;

    // Verificar se o leilão existe e pertence ao servidor
    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .select("*")
      .eq("id", params.auction_id)
      .eq("server_id", params.id)
      .single();

    if (auctionError || !auction) {
      return NextResponse.json(
        { error: "Leilão não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o leilão está agendado (não pode editar leilões ativos ou concluídos)
    if (auction.status !== "scheduled") {
      return NextResponse.json(
        { error: "Apenas leilões agendados podem ser editados" },
        { status: 400 }
      );
    }

    // Calcular o tempo de término com base na data de início e duração
    const startTime = new Date(scheduled_start_time);
    const endTime = new Date(startTime.getTime() + countdown_minutes * 60000);

    // Atualizar o leilão
    const { data: updatedAuction, error: updateError } = await supabase
      .from("auctions")
      .update({
        starting_bid,
        scheduled_start_time,
        end_time: endTime.toISOString(),
        countdown_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.auction_id)
      .select()
      .single();

    if (updateError) {
      console.error("Erro ao atualizar leilão:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar leilão" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Leilão atualizado com sucesso",
      data: updatedAuction,
    });
  } catch (error) {
    console.error("Erro ao processar atualização de leilão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para obter detalhes de um leilão específico
export async function GET(
  request: Request,
  { params }: { params: { id: string; auction_id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verificar se o usuário está autenticado
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

    // Buscar o leilão com detalhes do jogador
    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .select(
        `
        *,
        player:server_players (
          id,
          name,
          position,
          nationality,
          age,
          overall,
          potential,
          club:clubs!server_players_club_id_fkey (
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

    if (auctionError || !auction) {
      console.error("Erro ao buscar leilão:", auctionError);
      return NextResponse.json(
        { error: "Leilão não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: auction,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do leilão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
