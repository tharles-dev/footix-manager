import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { z } from "zod";

// Definindo a classe de erro personalizada
class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(["sent", "received"]).optional(),
  status: z.enum(["pending", "accepted", "rejected", "cancelled"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Não autorizado", 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const {
      page = "1",
      limit = "10",
      type,
      status,
    } = querySchema.parse(Object.fromEntries(searchParams));

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    let query = supabase.from("transfer_requests").select(
      `
        id,
        amount,
        status,
        created_at,
        player:server_players!transfer_requests_player_id_fkey (
          id,
          name,
          contract
        ),
        from_club:clubs!transfer_requests_from_club_id_fkey (
          id,
          name
        ),
        to_club:clubs!transfer_requests_to_club_id_fkey (
          id,
          name
        )
      `,
      { count: "exact" }
    );

    // Filtro por tipo (enviadas ou recebidas)
    if (type === "sent") {
      query = query.eq("to_club.user_id", user.id);
    } else if (type === "received") {
      query = query.eq("from_club.user_id", user.id);
    } else {
      // Se não especificado, busca todas as propostas relacionadas ao usuário
      query = query.or(
        `from_club.user_id.eq.${user.id},to_club.user_id.eq.${user.id}`
      );
    }

    // Filtro por status
    if (status) {
      query = query.eq("status", status);
    }

    // Ordenação e paginação
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNumber - 1);

    const { data: offers, error } = await query;

    if (error) {
      throw new ApiError("Erro ao buscar propostas de transferência", 500);
    }

    // Verificar se há ofertas com dados incompletos
    const validOffers =
      offers?.filter(
        (offer) => offer.player && offer.from_club && offer.to_club
      ) || [];

    return NextResponse.json({
      offers: validOffers,
      pagination: {
        total: validOffers.length,
        pages: Math.ceil(validOffers.length / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
