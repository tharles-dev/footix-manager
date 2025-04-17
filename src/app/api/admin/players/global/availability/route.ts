import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/";
import { cookies } from "next/headers";
import { z } from "zod";

const updateAvailabilitySchema = z.object({
  min_overall: z.number().min(1).max(99),
  max_overall: z.number().min(1).max(99),
  transfer_availability: z.enum(["available", "auction_only", "unavailable"]),
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário é admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Validar e obter dados da requisição
    const body = await request.json();
    const validatedData = updateAvailabilitySchema.parse(body);

    // Atualizar jogadores
    const { data: updatedPlayers, error: updateError } = await supabase
      .from("global_players")
      .update({ transfer_availability: validatedData.transfer_availability })
      .gte("overall", validatedData.min_overall)
      .lte("overall", validatedData.max_overall)
      .select();

    if (updateError) {
      console.error("Erro ao atualizar disponibilidade:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar disponibilidade dos jogadores" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updated_players: updatedPlayers,
      min_overall: validatedData.min_overall,
      max_overall: validatedData.max_overall,
      transfer_availability: validatedData.transfer_availability,
    });
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
