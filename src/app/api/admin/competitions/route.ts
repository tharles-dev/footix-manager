import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

// Schema para validação de criação de competição
const createCompetitionSchema = z.object({
  server_id: z.string().uuid(),
  name: z.string().min(3).max(100),
  type: z.enum(["league", "cup", "elite"]),
  season: z.number().int().positive(),
  points_win: z.number().int().min(1).max(3).default(3),
  points_draw: z.number().int().min(0).max(1).default(1),
  tie_break_order: z
    .array(z.string())
    .default([
      "goal_difference",
      "goals_for",
      "goals_against",
      "wins",
      "draws",
      "losses",
      "head_to_head",
    ]),
  reward_schema: z
    .object({
      positions: z.record(z.string(), z.number()),
      top_scorer: z.number().optional(),
      top_assister: z.number().optional(),
    })
    .optional(),
  red_card_penalty: z.number().min(0).max(1000000).default(50000),
  club_ids: z.array(z.string().uuid()).min(2),
});

// POST /api/admin/competitions
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verifica rate limit
    await checkRateLimit("admin-competitions-create", 5, 60); // 5 requisições por minuto

    // Verifica se o usuário é administrador
    const userId = request.headers.get("user-id");
    if (!userId) {
      throw new ApiError({
        message: "Usuário não autenticado",
        code: "UNAUTHORIZED",
      });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (!user || user.role !== "admin") {
      throw new ApiError({
        message:
          "Acesso negado. Apenas administradores podem criar competições.",
        code: "FORBIDDEN",
      });
    }

    // Valida e processa o payload
    const payload = await request.json();
    const validatedData = createCompetitionSchema.parse(payload);

    // Verifica se o servidor existe
    const { data: server } = await supabase
      .from("servers")
      .select("id, status, season")
      .eq("id", validatedData.server_id)
      .single();

    if (!server) {
      throw new ApiError({
        message: "Servidor não encontrado",
        code: "SERVER_NOT_FOUND",
      });
    }

    // Verifica se a temporada corresponde à do servidor
    if (validatedData.season !== server.season) {
      throw new ApiError({
        message:
          "A temporada da competição deve corresponder à temporada do servidor",
        code: "INVALID_SEASON",
      });
    }

    // Verifica se os clubes existem e pertencem ao servidor
    const { data: clubs, error: clubsError } = await supabase
      .from("clubs")
      .select("id, server_id")
      .in("id", validatedData.club_ids);

    if (
      clubsError ||
      !clubs ||
      clubs.length !== validatedData.club_ids.length
    ) {
      throw new ApiError({
        message: "Um ou mais clubes não foram encontrados",
        code: "CLUBS_NOT_FOUND",
      });
    }

    // Verifica se todos os clubes pertencem ao servidor
    const invalidClubs = clubs.filter(
      (club) => club.server_id !== validatedData.server_id
    );
    if (invalidClubs.length > 0) {
      throw new ApiError({
        message: "Um ou mais clubes não pertencem ao servidor especificado",
        code: "INVALID_CLUB_SERVER",
      });
    }

    // Cria a competição
    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .insert({
        server_id: validatedData.server_id,
        name: validatedData.name,
        type: validatedData.type,
        season: validatedData.season,
        points_win: validatedData.points_win,
        points_draw: validatedData.points_draw,
        tie_break_order: validatedData.tie_break_order,
        reward_schema: validatedData.reward_schema || {
          positions: {
            1: 5000000,
            2: 3000000,
            3: 2000000,
            4: 1000000,
          },
          top_scorer: 1000000,
          top_assister: 500000,
        },
        red_card_penalty: validatedData.red_card_penalty,
      })
      .select()
      .single();

    if (competitionError) {
      throw new ApiError({
        message: "Erro ao criar competição",
        code: "COMPETITION_CREATE_FAILED",
        details: competitionError,
      });
    }

    // Adiciona clubes à competição
    const competitionClubs = validatedData.club_ids.map((clubId) => ({
      competition_id: competition.id,
      club_id: clubId,
      points: 0,
      goals_for: 0,
      goals_against: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    }));

    const { error: clubsInsertError } = await supabase
      .from("competition_clubs")
      .insert(competitionClubs);

    if (clubsInsertError) {
      // Se falhar ao adicionar clubes, remove a competição
      await supabase.from("competitions").delete().eq("id", competition.id);

      throw new ApiError({
        message: "Erro ao adicionar clubes à competição",
        code: "COMPETITION_CLUBS_INSERT_FAILED",
        details: clubsInsertError,
      });
    }

    // Registra log administrativo
    await supabase.from("admin_logs").insert({
      server_id: validatedData.server_id,
      type: "competition_created",
      message: `Competição "${validatedData.name}" criada com ${validatedData.club_ids.length} clubes`,
      metadata: {
        competition_id: competition.id,
        competition_name: validatedData.name,
        competition_type: validatedData.type,
        club_count: validatedData.club_ids.length,
      },
    });

    return NextResponse.json({
      message: "Competição criada com sucesso",
      data: {
        competition: {
          id: competition.id,
          name: competition.name,
          type: competition.type,
          season: competition.season,
          club_count: validatedData.club_ids.length,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error("Erro ao criar competição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
