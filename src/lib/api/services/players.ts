import { ApiService } from "@/lib/api/base";

export interface GlobalPlayer {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: string;
  overall: number;
  potential: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  base_salary: number;
  base_value: number;
}

export interface ImportPlayersResponse {
  success: boolean;
  imported: number;
  errors?: string[];
}

export interface UpdateGlobalPlayersSalaryData {
  updated_players: number;
  min_overall: number;
  max_overall: number;
  base_salary: number;
  market_value_multiplier: number;
}

export interface UpdateGlobalPlayersSalaryResponse {
  data: UpdateGlobalPlayersSalaryData;
}

export class PlayersService extends ApiService {
  async importPlayers(file: File): Promise<ImportPlayersResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Usar fetch diretamente para enviar FormData
      const response = await fetch("/api/admin/players/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao importar jogadores");
      }

      const data = await response.json();
      return {
        success: true,
        imported: data.count || 0,
      };
    } catch (error) {
      console.error("Erro ao importar jogadores:", error);
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : "Erro desconhecido"],
      };
    }
  }

  async getGlobalPlayers(params?: {
    page?: number;
    limit?: number;
    position?: string;
    min_age?: number;
    max_age?: number;
    min_value?: number;
    max_value?: number;
    search?: string;
  }): Promise<{
    players: GlobalPlayer[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }> {
    try {
      // Construir URL com parâmetros de consulta
      let url = "/api/admin/players/global";
      if (params) {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.position) queryParams.append("position", params.position);
        if (params.min_age)
          queryParams.append("min_age", params.min_age.toString());
        if (params.max_age)
          queryParams.append("max_age", params.max_age.toString());
        if (params.min_value)
          queryParams.append("min_value", params.min_value.toString());
        if (params.max_value)
          queryParams.append("max_value", params.max_value.toString());
        if (params.search) queryParams.append("search", params.search);

        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      // Fazer a requisição para o endpoint
      const response = await this.get<{
        players: GlobalPlayer[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          total_pages: number;
        };
      }>(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar jogadores globais:", error);
      throw error;
    }
  }

  async getGlobalPlayerById(id: string): Promise<GlobalPlayer> {
    try {
      const response = await this.get<GlobalPlayer>(
        `/api/admin/players/global/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar jogador global com ID ${id}:`, error);
      throw error;
    }
  }

  async updateGlobalPlayersSalary(params: {
    min_overall: number;
    max_overall: number;
    base_salary: number;
    market_value_multiplier: number;
  }): Promise<UpdateGlobalPlayersSalaryResponse> {
    return this.post<UpdateGlobalPlayersSalaryData>(
      "/api/admin/players/global/salary",
      params
    );
  }
}
