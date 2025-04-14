import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CreateClubResponse } from "@/types/club";

const createClubSchema = z.object({
  name: z.string().min(3).max(50),
  city: z.string().min(3).max(50),
  country: z.string().min(2).max(50),
  logo_url: z.string().url().optional(),
  server_id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar se o usuário já tem um clube
    const { data: existingClub } = await supabase
      .from("clubs")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingClub) {
      return NextResponse.json(
        { error: "User already has a club" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createClubSchema.parse(body);

    // Buscar configurações do servidor
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("*")
      .eq("id", validatedData.server_id)
      .single();

    if (serverError || !server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Verificar se o servidor está em período de inscrição
    if (server.status !== "inscricao") {
      return NextResponse.json(
        { error: "Server is not accepting new clubs" },
        { status: 400 }
      );
    }

    // Verificar se o servidor tem vagas
    if (server.current_members >= server.max_members) {
      return NextResponse.json({ error: "Server is full" }, { status: 400 });
    }

    const clubData = {
      ...validatedData,
      user_id: user.id,
      server_id: validatedData.server_id,
      balance: server.initial_budget,
      season_budget_base: server.initial_budget,
      reputation: 50,
      fan_base: 1000,
      stadium_capacity: 10000,
      ticket_price: 20,
      season_ticket_holders: 100,
    };

    const { data: club, error: insertError } = await supabase
      .from("clubs")
      .insert(clubData)
      .select("*")
      .single();

    if (insertError) {
      console.error("Error creating club:", insertError);
      return NextResponse.json(
        { error: "Failed to create club" },
        { status: 500 }
      );
    }

    // Atualizar contador de membros do servidor
    const { error: updateError } = await supabase
      .from("servers")
      .update({ current_members: server.current_members + 1 })
      .eq("id", server.id);

    if (updateError) {
      console.error("Error updating server members count:", updateError);
    }

    // Atualizar server_members com o club_id
    const { error: memberUpdateError } = await supabase
      .from("server_members")
      .update({ club_id: club.id })
      .eq("user_id", user.id)
      .eq("server_id", validatedData.server_id);

    if (memberUpdateError) {
      console.error("Error updating server member:", memberUpdateError);
      // Não retornamos erro aqui pois o clube já foi criado
    }

    const response: CreateClubResponse = { club };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error in club creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
