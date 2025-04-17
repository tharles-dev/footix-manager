import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";
import { z } from "zod";

// Schema de validação para criação de leilão
const createAuctionSchema = z.object({
  player_id: z.string().uuid(),
  starting_bid: z.number().min(100000),
  is_scheduled: z.boolean().default(true),
  countdown_minutes: z.number().min(1).max(1440),
  scheduled_start_time: z.string().refine((date) => {
    try {
      // Verifica se a data está no formato correto (YYYY-MM-DDTHH:mm)
      const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      if (!regex.test(date)) return false;

      // Tenta criar um objeto Date para validar
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }, "Data inválida"),
});

// Schema de validação para atualização de leilão
const updateAuctionSchema = z.object({
  auction_id: z.string().uuid(),
  starting_bid: z.number().min(100000).optional(),
  is_scheduled: z.boolean().optional(),
  countdown_minutes: z.number().min(1).max(1440).optional(),
  scheduled_start_time: z
    .string()
    .refine((date) => {
      try {
        // Verifica se a data está no formato correto (YYYY-MM-DDTHH:mm)
        const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        if (!regex.test(date)) return false;

        // Tenta criar um objeto Date para validar
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime());
      } catch {
        return false;
      }
    }, "Data inválida")
    .optional(),
});

export async function POST(
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

    // Validar dados do request
    const body = await request.json();
    const validatedData = createAuctionSchema.parse(body);

    // Verificar se o jogador está disponível para leilão
    const { data: player, error: playerError } = await supabase
      .from("server_players")
      .select("id, club_id, transfer_availability")
      .eq("id", validatedData.player_id)
      .eq("server_id", params.id)
      .or("transfer_availability.eq.auction_only,club_id.is.null")
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: "Jogador não encontrado ou não disponível para leilão" },
        { status: 404 }
      );
    }

    // Verificar se já existe um leilão agendado para este jogador
    const { data: existingAuction, error: existingAuctionError } =
      await supabase
        .from("auctions")
        .select("id, status")
        .eq("player_id", validatedData.player_id)
        .eq("server_id", params.id)
        .in("status", ["scheduled", "active"])
        .single();

    if (existingAuctionError && existingAuctionError.code !== "PGRST116") {
      console.error(
        "Erro ao verificar leilões existentes:",
        existingAuctionError
      );
      return NextResponse.json(
        { error: "Erro ao verificar leilões existentes" },
        { status: 500 }
      );
    }

    if (existingAuction) {
      return NextResponse.json(
        { error: "Já existe um leilão agendado ou ativo para este jogador" },
        { status: 409 }
      );
    }

    // Calcular end_time baseado no scheduled_start_time ou now()
    const startTime =
      validatedData.is_scheduled && validatedData.scheduled_start_time
        ? new Date(validatedData.scheduled_start_time)
        : new Date();

    // Garantir que a data está no formato correto para o banco de dados
    const formattedStartTime = startTime.toISOString();

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + validatedData.countdown_minutes);

    // Criar o leilão
    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .insert({
        server_id: params.id,
        player_id: validatedData.player_id,
        seller_club_id: player.club_id || null,
        starting_bid: validatedData.starting_bid,
        current_bid: validatedData.starting_bid,
        status: validatedData.is_scheduled ? "scheduled" : "active",
        is_scheduled: validatedData.is_scheduled,
        scheduled_start_time: formattedStartTime,
        countdown_minutes: validatedData.countdown_minutes,
        end_time: endTime.toISOString(),
      })
      .select()
      .single();

    if (auctionError) {
      console.error("Erro ao criar leilão:", auctionError);
      return NextResponse.json(
        { error: "Erro ao criar leilão" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: auction }, { status: 201 });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

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
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // 'free' para jogadores livres, 'scheduled' para agendados
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    if (type === "free") {
      // Buscar jogadores livres que não têm leilões agendados/ativos
      const { data: freePlayers, error: freePlayersError } = await supabase
        .from("server_players")
        .select(
          `
          id,
          name,
          position,
          overall,
          club_id,
          transfer_availability,
          auctions!left (
            id,
            status
          )
        `
        )
        .eq("server_id", params.id)
        .or("transfer_availability.eq.auction_only,club_id.is.null")
        .is("club_id", null)
        .not("auctions.status", "in", '("scheduled","active")')
        .range(offset, offset + limit - 1);

      if (freePlayersError) {
        console.error("Erro ao buscar jogadores livres:", freePlayersError);
        return NextResponse.json(
          { error: "Erro ao buscar jogadores livres" },
          { status: 500 }
        );
      }

      // Obter contagem total de jogadores livres
      const { count } = await supabase
        .from("server_players")
        .select("*", { count: "exact", head: true })
        .eq("server_id", params.id)
        .is("club_id", null)
        .not("auctions.status", "in", '("scheduled","active")');

      return NextResponse.json({
        data: freePlayers,
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      });
    } else {
      // Buscar leilões agendados/ativos
      let query = supabase
        .from("auctions")
        .select(
          `
          *,
          player:server_players(
            id,
            name,
            position,
            overall
          ),
          seller_club:clubs!seller_club_id(
            id,
            name,
            logo_url
          ),
          current_bidder:clubs!current_bidder_id(
            id,
            name,
            logo_url
          )
        `
        )
        .eq("server_id", params.id)
        .order("created_at", { ascending: false });

      // Aplicar filtro de status se fornecido
      if (status) {
        query = query.eq("status", status);
      } else {
        // Se não houver status específico, mostrar apenas agendados e ativos
        query = query.in("status", ["scheduled", "active"]);
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

      // Obter contagem total
      const { count } = await supabase
        .from("auctions")
        .select("*", { count: "exact", head: true })
        .eq("server_id", params.id)
        .in("status", ["scheduled", "active"]);

      return NextResponse.json({
        data: auctions,
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      });
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Validar dados do request
    const body = await request.json();
    const validatedData = updateAuctionSchema.parse(body);

    // Verificar se o leilão existe e pode ser editado
    const { data: existingAuction, error: auctionError } = await supabase
      .from("auctions")
      .select("*")
      .eq("id", validatedData.auction_id)
      .eq("server_id", params.id)
      .single();

    if (auctionError || !existingAuction) {
      return NextResponse.json(
        { error: "Leilão não encontrado" },
        { status: 404 }
      );
    }

    if (existingAuction.status !== "scheduled") {
      return NextResponse.json(
        { error: "Apenas leilões agendados podem ser editados" },
        { status: 400 }
      );
    }

    // Calcular novo end_time se necessário
    const endTime = existingAuction.end_time;
    if (validatedData.scheduled_start_time || validatedData.countdown_minutes) {
      const startTime = validatedData.scheduled_start_time
        ? new Date(validatedData.scheduled_start_time)
        : new Date(existingAuction.scheduled_start_time);

      // A data já vem em UTC do frontend, então não precisamos converter
      const formattedStartTime = startTime.toISOString();

      const endTime = new Date(startTime);
      endTime.setMinutes(
        endTime.getMinutes() +
          (validatedData.countdown_minutes || existingAuction.countdown_minutes)
      );

      const updateData = {
        scheduled_start_time: formattedStartTime,
        end_time: endTime.toISOString(),
      };

      const { error: updateError } = await supabase
        .from("auctions")
        .update(updateData)
        .eq("id", validatedData.auction_id);

      if (updateError) {
        console.error("Erro ao atualizar datas do leilão:", updateError);
        return NextResponse.json(
          { error: "Erro ao atualizar datas do leilão" },
          { status: 500 }
        );
      }
    }

    // Atualizar o leilão
    const { data: updatedAuction, error: updateError } = await supabase
      .from("auctions")
      .update({
        starting_bid:
          validatedData.starting_bid || existingAuction.starting_bid,
        current_bid: validatedData.starting_bid || existingAuction.current_bid,
        is_scheduled:
          validatedData.is_scheduled ?? existingAuction.is_scheduled,
        countdown_minutes:
          validatedData.countdown_minutes || existingAuction.countdown_minutes,
        scheduled_start_time:
          validatedData.scheduled_start_time ||
          existingAuction.scheduled_start_time,
        end_time: endTime,
      })
      .eq("id", validatedData.auction_id)
      .select()
      .single();

    if (updateError) {
      console.error("Erro ao atualizar leilão:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar leilão" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedAuction });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
