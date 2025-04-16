import { SupabaseClient } from "@supabase/supabase-js";
import { ListPlayersParams } from "../schemas/transfer";
import { Database } from "../../database.types";

export async function listPlayers(
  supabase: SupabaseClient<Database>,
  serverId: string,
  params: ListPlayersParams
) {
  try {
    const { data: serverConfig, error: serverError } = await supabase
      .from("servers")
      .select(
        "market_value_multiplier, min_player_salary_percentage, max_player_salary_percentage, auto_clause_percentage"
      )
      .eq("id", serverId)
      .single();

    if (serverError) throw serverError;
    if (!serverConfig)
      throw new Error("Configurações do servidor não encontradas");

    let query = supabase
      .from("server_players")
      .select(
        `
        *,
        club:clubs!server_players_club_id_fkey(
          id,
          name,
          user:users(
            id,
            name
          )
        ),
        loan_from_club:clubs!server_players_loan_from_club_id_fkey(
          id,
          name
        )
      `,
        { count: "exact" }
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

    if (params.transferAvailability) {
      query = query.eq("transfer_availability", params.transferAvailability);
    }

    if (params.minOverall !== undefined) {
      query = query.gte("overall", params.minOverall);
    }

    if (params.maxOverall !== undefined) {
      query = query.lte("overall", params.maxOverall);
    }

    if (params.minAge !== undefined) {
      query = query.gte("age", params.minAge);
    }

    if (params.maxAge !== undefined) {
      query = query.lte("age", params.maxAge);
    }

    if (params.minValue !== undefined) {
      const minSalary = params.minValue / serverConfig.market_value_multiplier;
      query = query.gte("contract->salary", minSalary);
    }

    if (params.maxValue !== undefined) {
      const maxSalary = params.maxValue / serverConfig.market_value_multiplier;
      query = query.lte("contract->salary", maxSalary);
    }

    if (params.search) {
      query = query.ilike("name", `%${params.search}%`);
    }

    console.log("params.hasContract", params.hasContract);

    if (params.hasContract !== undefined) {
      if (params.hasContract) {
        query = query.not("club_id", "is", null);
      } else {
        query = query.is("club_id", null);
      }
    }

    // Paginação
    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    query = query.range(start, end);

    const { data: players, error, count } = await query;

    if (error) throw error;

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
      page: page,
      limit: limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    };
  } catch (error) {
    console.error("Erro ao listar jogadores:", error);
    throw error;
  }
}
