import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { apiResponse } from "@/lib/api/response";
import { z } from "zod";

const createClubSchema = z.object({
  name: z.string().min(3).max(50),
  city: z.string().min(2).max(50),
  country: z.string().min(2).max(50),
  logo_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // 1. Verifica autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiResponse({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Verifica se usuário já tem clube
    const { data: existingClub } = await supabase
      .from("server_members")
      .select("club_id")
      .eq("user_id", user.id)
      .single();

    if (existingClub?.club_id) {
      return apiResponse(
        { error: "Usuário já possui um clube" },
        { status: 400 }
      );
    }

    // 3. Busca servidor do usuário
    const { data: serverMember } = await supabase
      .from("server_members")
      .select("server_id")
      .eq("user_id", user.id)
      .single();

    if (!serverMember?.server_id) {
      return apiResponse(
        { error: "Usuário não está vinculado a um servidor" },
        { status: 400 }
      );
    }

    // 4. Valida dados do clube
    const body = await request.json();
    const validatedData = createClubSchema.parse(body);

    // 5. Cria clube
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .insert({
        server_id: serverMember.server_id,
        user_id: user.id,
        name: validatedData.name,
        city: validatedData.city,
        country: validatedData.country,
        logo_url: validatedData.logo_url,
        balance: 5000000, // Valor inicial
        season_budget_base: 5000000,
        reputation: 50,
        fan_base: 1000,
        stadium_capacity: 10000,
        ticket_price: 20,
        season_ticket_holders: 100,
      })
      .select()
      .single();

    if (clubError) {
      console.error("Erro ao criar clube:", clubError);
      return apiResponse({ error: "Erro ao criar clube" }, { status: 500 });
    }

    // 6. Atualiza server_members com o clube criado
    const { error: updateError } = await supabase
      .from("server_members")
      .update({ club_id: club.id })
      .eq("user_id", user.id)
      .eq("server_id", serverMember.server_id);

    if (updateError) {
      console.error("Erro ao atualizar server_members:", updateError);
      return apiResponse(
        { error: "Erro ao vincular clube ao usuário" },
        { status: 500 }
      );
    }

    return apiResponse({
      message: "Clube criado com sucesso",
      club,
    });
  } catch (error) {
    console.error("Erro ao criar clube:", error);
    if (error instanceof z.ZodError) {
      return apiResponse(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return apiResponse({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
