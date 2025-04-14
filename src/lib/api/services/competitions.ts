import { ApiService } from "../base";

export type Competition = {
  id: string;
  server_id: string;
  name: string;
  type: "league" | "cup" | "elite";
  season: number;
  points_win: number;
  points_draw: number;
  tie_break_order: string[];
  reward_schema: {
    positions: Record<string, number>;
    top_scorer?: number;
    top_assister?: number;
  };
  red_card_penalty: number;
  club_ids: string[];
  created_at: string;
  updated_at: string;
};

export type CreateCompetitionPayload = {
  server_id: string;
  name: string;
  type: "league" | "cup" | "elite";
  season: number;
  points_win?: number;
  points_draw?: number;
  tie_break_order?: string[];
  reward_schema: {
    positions: Record<string, number>;
    top_scorer?: number;
    top_assister?: number;
  };
  red_card_penalty?: number;
  club_ids: string[];
};

export type Playoff = {
  id: string;
  competition_id: string;
  season: number;
  status: "pending" | "in_progress" | "completed";
  start_date: string;
  end_date: string;
  qualified_clubs: {
    club_id: string;
    position: number;
  }[];
  bracket: {
    rounds: {
      round: number;
      matches: {
        match_number: number;
      }[];
    }[];
  };
  matches: Match[];
  competition: Competition;
};

export type Match = {
  id: string;
  round: number;
  match_number: number;
  home_club_id: string;
  away_club_id: string;
  home_goals?: number;
  away_goals?: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_at: string;
  match_stats?: {
    possession: {
      home: number;
      away: number;
    };
    shots?: {
      home: number;
      away: number;
    };
    shots_on_target?: {
      home: number;
      away: number;
    };
    corners?: {
      home: number;
      away: number;
    };
    fouls?: {
      home: number;
      away: number;
    };
  };
  home_club: {
    id: string;
    name: string;
    logo_url?: string;
  };
  away_club: {
    id: string;
    name: string;
    logo_url?: string;
  };
};

export class CompetitionsService extends ApiService {
  private endpoint = "competitions";

  async getAll(serverId: string): Promise<Competition[]> {
    const response = await this.get<Competition[]>(this.endpoint, {
      server_id: serverId,
    });
    return response.data;
  }

  async getById(id: string): Promise<Competition> {
    const response = await this.get<Competition>(this.endpoint, { id });
    return response.data;
  }

  async create(payload: CreateCompetitionPayload): Promise<Competition> {
    const response = await this.post<Competition>(this.endpoint, payload);
    return response.data;
  }

  async update(
    id: string,
    payload: Partial<CreateCompetitionPayload>
  ): Promise<Competition> {
    const response = await this.put<Competition>(this.endpoint, id, payload);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await this.delete(this.endpoint, id);
  }

  async getPlayoffs(competitionId: string): Promise<Playoff[]> {
    const response = await this.get<Playoff[]>(
      `${this.endpoint}/${competitionId}/playoffs`
    );
    return response.data;
  }

  async createPlayoffs(
    competitionId: string,
    topTeams: number = 8
  ): Promise<Playoff> {
    const response = await this.post<Playoff>(
      `${this.endpoint}/${competitionId}/playoffs`,
      { top_teams: topTeams }
    );
    return response.data;
  }

  async updateMatchScore(
    matchId: string,
    score: {
      home_goals: number;
      away_goals: number;
      match_stats?: Match["match_stats"];
    }
  ): Promise<Match> {
    const response = await this.post<Match>(
      `playoffs/matches/${matchId}/score`,
      score
    );
    return response.data;
  }

  async distributeRewards(competitionId: string): Promise<void> {
    await this.post(`${this.endpoint}/${competitionId}/rewards`, {});
  }
}
