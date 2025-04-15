import { SupabaseClient } from "@supabase/supabase-js";
import { ListPlayersParams } from "../schemas/transfer";
import { Database } from "../../database.types";

export async function listPlayers(
  supabase: SupabaseClient<Database>,
  serverId: string,
  params: ListPlayersParams
) {
  let query = supabase
    .from("server_players")
    .select(
      `
      *,
      club:clubs(
        id,
        name,
        user:users(
          id,
          name
        )
      )
    `
    )
    .eq("server_id", serverId)
    .order("overall", { ascending: false });

  // Aplicar filtros
  if (params.position) {
    query = query.eq("position", params.position);
  }

  if (params.nationality) {
    query = query.eq("nationality", params.nationality);
  }

  if (params.status) {
    switch (params.status) {
      case "free":
        query = query.is("club_id", null);
        break;
      case "club":
        query = query.not("club_id", "is", null);
        break;
      case "auction_only":
        query = query.eq("transfer_availability", "auction_only");
        break;
      case "loan":
        query = query.eq("is_on_loan", true);
        break;
    }
  }

  if (params.minOverall) {
    query = query.gte("overall", params.minOverall);
  }

  if (params.maxOverall) {
    query = query.lte("overall", params.maxOverall);
  }

  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  // Paginação
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  query = query.range(from, to);

  const { data: players, error, count } = await query;

  if (error) {
    throw error;
  }

  // Buscar configurações do servidor para cálculos
  const { data: serverConfig } = await supabase
    .from("servers")
    .select(
      "market_value_multiplier, min_player_salary_percentage, max_player_salary_percentage, auto_clause_percentage"
    )
    .eq("id", serverId)
    .single();

  if (!serverConfig) {
    throw new Error("Server configuration not found");
  }

  // Processar jogadores com cálculos
  const processedPlayers = players.map((player) => {
    const salarioBase = player.contract?.salary || 0;
    const valorMercado = salarioBase * serverConfig.market_value_multiplier;
    const valorClausula = player.club
      ? valorMercado * (serverConfig.auto_clause_percentage / 100)
      : null;

    return {
      ...player,
      salario_atual: salarioBase,
      salario_minimo: player.club
        ? salarioBase * (serverConfig.min_player_salary_percentage / 100)
        : salarioBase,
      salario_maximo: player.club
        ? salarioBase * (serverConfig.max_player_salary_percentage / 100)
        : salarioBase,
      valor_mercado: valorMercado,
      valor_clausula: valorClausula,
      acoes_disponiveis: {
        pode_contratar:
          !player.club_id ||
          (player.club_id && player.transfer_availability === "available"),
        pode_pagar_clausula: !!player.club_id,
        pode_emprestar: !!player.club_id && !player.is_on_loan,
      },
    };
  });

  return {
    players: processedPlayers,
    total: count || 0,
    page: params.page,
    limit: params.limit,
    totalPages: count ? Math.ceil(count / params.limit) : 0,
  };
}
