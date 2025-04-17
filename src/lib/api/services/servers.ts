import { ApiService } from "../base";

export type Server = {
  id: string;
  name: string;
  max_members: number;
  current_members: number;
  season_length_days: number;
  entry_mode: "public" | "private";
  registration_deadline?: string;
  current_season_start?: string;
  current_season_end?: string;
  registration_start?: string;
  transfer_window_open: boolean;
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
  red_card_penalty: number;
  allow_penalty_waiver: boolean;
  players_source?: string;
  created_at: string;
  updated_at: string;
  allow_free_agent_signing_outside_window: boolean;
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
    const response = await this.get<Server[]>(this.endpoint, { id });
    return response.data[0];
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
