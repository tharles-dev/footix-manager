export interface Club {
  id: string;
  name: string;
  city: string;
  country: string;
  logo_url?: string;
  balance: number;
  base_budget: number;
  reputation: number;
  fans: number;
  stadium_capacity: number;
  ticket_price: number;
  season_ticket_holders: number;
  created_at: string;
  updated_at: string;
}

export interface CreateClubRequest {
  name: string;
  city: string;
  country: string;
  logo_url?: string;
  server_id: string;
}

export interface CreateClubResponse {
  club: Club;
}
