import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { apiResponse } from "@/lib/api/response";

export async function POST() {
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

    // 2. Verifica se já está vinculado a algum servidor
    const { data: serverMember } = await supabase
      .from("server_members")
      .select("server_id, club_id")
      .eq("user_id", user.id)
      .single();

    // Se já está vinculado, busca dados completos do servidor
    if (serverMember) {
      const { data: serverData } = await supabase
        .from("servers")
        .select("*")
        .eq("id", serverMember.server_id)
        .single();

      return apiResponse({
        has_server: true,
        has_club: !!serverMember.club_id,
        server_id: serverMember.server_id,
        club_id: serverMember.club_id,
        server: serverData,
      });
    }

    // 3. Busca servidor disponível
    const { data: availableServer, error: serverError } = await supabase
      .from("available_servers")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (serverError || !availableServer) {
      return apiResponse(
        { error: "Nenhum servidor disponível no momento" },
        { status: 404 }
      );
    }

    // 4. Registra usuário no servidor
    const { error: registerError } = await supabase
      .from("server_members")
      .insert({
        user_id: user.id,
        server_id: availableServer.id,
      });

    if (registerError) {
      return apiResponse(
        { error: "Erro ao registrar no servidor" },
        { status: 500 }
      );
    }

    // 6. Retorna status da vinculação com dados do servidor
    return apiResponse({
      has_server: true,
      has_club: false,
      server_id: availableServer.id,
      server: availableServer,
    });
  } catch (error) {
    console.error("Erro ao processar servidor:", error);
    return apiResponse({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
