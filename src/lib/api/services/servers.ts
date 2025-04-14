import { ApiService } from "../base";

export type Server = {
  id: string;
  name: string;
  max_members: number;
  initial_budget: number;
  budget_growth_per_season: number;
  salary_cap: number;
  salary_cap_penalty_percentage: number;
  min_player_salary_percentage: number;
  max_player_salary_percentage: number;
  activate_clause: boolean;
  auto_clause_percentage: number;
  market_value_multiplier: number;
  enable_monetization: boolean;
  match_frequency_minutes: number;
  enable_auto_simulation: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateServerPayload = {
  name: string;
  max_members: number;
  initial_budget: number;
  budget_growth_per_season: number;
  salary_cap: number;
  salary_cap_penalty_percentage: number;
  min_player_salary_percentage: number;
  max_player_salary_percentage: number;
  activate_clause: boolean;
  auto_clause_percentage: number;
  market_value_multiplier: number;
  enable_monetization: boolean;
  match_frequency_minutes: number;
  enable_auto_simulation: boolean;
};

export class ServersService extends ApiService {
  private endpoint = "servers";

  async getAll(): Promise<Server[]> {
    const response = await this.get<Server[]>(this.endpoint);
    return response.data;
  }

  async getById(id: string): Promise<Server> {
    const response = await this.get<Server>(this.endpoint, { id });
    return response.data;
  }

  async create(payload: CreateServerPayload): Promise<Server> {
    const response = await this.post<Server>(this.endpoint, payload);
    return response.data;
  }

  async update(
    id: string,
    payload: Partial<CreateServerPayload>
  ): Promise<Server> {
    const response = await this.put<Server>(this.endpoint, id, payload);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await this.delete(this.endpoint, id);
  }

  async closeSeason(serverId: string): Promise<void> {
    await this.post(`${this.endpoint}/${serverId}/season/close`, {});
  }
}
