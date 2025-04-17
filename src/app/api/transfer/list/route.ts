import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

// Interfaces para os tipos de dados retornados pelo Supabase
interface ServerPlayer {
  id: string;
  name: string;
  contract: {
    salary: number;
    clause_value?: number;
    contract_start: string;
    contract_end: string;
  };
}

interface Club {
  id: string;
  name: string;
  user_id: string;
}

interface TransferRequest {
  id: string;
  server_id: string;
  player_id: string;
  from_club_id: string;
  to_club_id: string;
  amount: number;
  status: string;
  created_at: string;
  server_players: ServerPlayer;
  from_club: Club;
  to_club: Club;
}

const listTransferRequestsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["pending", "accepted", "rejected", "cancelled"]).optional(),
  type: z.enum(["sent", "received"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError({
        message: "Não autorizado",
        code: "UNAUTHORIZED",
      });
    }

    // Validar parâmetros da requisição
    const searchParams = request.nextUrl.searchParams;
    const {
      page = "1",
      limit = "10",
      status,
      type,
    } = listTransferRequestsSchema.parse(Object.fromEntries(searchParams));

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // 1. OBTER CLUBE DO USUÁRIO

    const { data: userClub, error: clubError } = await supabase
      .from("clubs")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clubError || !userClub) {
      throw new ApiError({
        message: "Clube não encontrado",
        code: "CLUB_NOT_FOUND",
      });
    }

    // 2. CONSTRUIR QUERY BASE

    let query = supabase.from("transfer_requests").select(
      `
        id,
        server_id,
        player_id,
        from_club_id,
        to_club_id,
        amount,
        status,
        created_at,
        server_players (
          id,
          name,
          contract
        ),
        from_club:clubs!transfer_requests_from_club_id_fkey (
          id,
          name,
          user_id
        ),
        to_club:clubs!transfer_requests_to_club_id_fkey (
          id,
          name,
          user_id
        )
      `,
      { count: "exact" }
    );

    // 3. APLICAR FILTROS

    // Filtrar por status
    if (status) {
      query = query.eq("status", status);
    }

    // Filtrar por tipo (enviadas ou recebidas)
    if (type === "sent") {
      query = query.eq("to_club_id", userClub.id);
    } else if (type === "received") {
      query = query.eq("from_club_id", userClub.id);
    } else {
      // Se não especificado, mostrar todas as propostas relacionadas ao clube
      query = query.or(
        `from_club_id.eq.${userClub.id},to_club_id.eq.${userClub.id}`
      );
    }

    // 4. APLICAR PAGINAÇÃO

    const from = (pageNumber - 1) * limitNumber;
    const to = from + limitNumber - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    // 5. EXECUTAR QUERY

    const { data, error, count } = await query;

    if (error) {
      console.error("Erro ao buscar propostas:", error);
      throw new ApiError({
        message: "Erro ao buscar propostas de transferência",
        code: "TRANSFER_REQUESTS_FETCH_FAILED",
      });
    }

    // 6. FORMATAR RESPOSTA

    const transferRequests = (data as unknown as TransferRequest[]).map(
      (request) => ({
        id: request.id,
        player: {
          id: request.server_players.id,
          name: request.server_players.name,
          contract: request.server_players.contract,
        },
        from_club: {
          id: request.from_club.id,
          name: request.from_club.name,
        },
        to_club: {
          id: request.to_club.id,
          name: request.to_club.name,
        },
        amount: request.amount,
        status: request.status,
        created_at: request.created_at,
      })
    );

    return NextResponse.json({
      data: transferRequests,
      pagination: {
        total: count || 0,
        page: pageNumber,
        limit: limitNumber,
        total_pages: Math.ceil((count || 0) / limitNumber),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Parâmetros inválidos", errors: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao listar propostas de transferência:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
