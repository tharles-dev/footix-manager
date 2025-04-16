import { createServerClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { apiResponse, apiError } from "@/lib/api/utils";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Get session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError(
        { message: "Not authenticated", code: "NOT_AUTHENTICATED" },
        401
      );
    }

    // Get user data
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userDataError) {
      return apiError(
        { message: userDataError.message, code: "USER_NOT_FOUND" },
        404
      );
    }

    // Get user's club if exists
    const { data: club } = await supabase
      .from("clubs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Se o clube existir, buscar informações adicionais
    if (club) {
      // Buscar configurações do servidor para cálculos de teto salarial
      const { data: serverConfig } = await supabase
        .from("servers")
        .select("salary_cap, transfer_window_open")
        .eq("id", club.server_id)
        .single();

      // Buscar jogadores do clube para calcular salários
      const { data: players } = await supabase
        .from("server_players")
        .select("contract")
        .eq("club_id", club.id)
        .eq("server_id", club.server_id);

      // Calcular teto salarial
      const salaryCap =
        club.season_budget_base * (serverConfig?.salary_cap / 100) || 0;

      // Calcular total de salários atuais
      const currentTotalSalaries =
        players?.reduce((total, player) => {
          return total + (player.contract?.salary || 0);
        }, 0) || 0;

      // Adicionar informações financeiras ao objeto do clube
      club.financial_info = {
        salary_cap: salaryCap,
        current_total_salaries: currentTotalSalaries,
        salary_cap_remaining: salaryCap - currentTotalSalaries,
        transfer_window_open: serverConfig?.transfer_window_open || false,
      };
    }

    return apiResponse({
      user: userData,
      club: club || null,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return apiError(
      {
        message: "Internal server error",
        code: "INTERNAL_SERVER_ERROR",
      },
      500
    );
  }
}
