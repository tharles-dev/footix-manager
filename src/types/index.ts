export interface Player {
  id: string;
  name: string;
  position: string;
  overall: number;
  potential: number;
  nationality: string;
  age: number;
  market_value_multiplier: number;
  contract: {
    salary: number;
    clause_value: number;
    contract_end: string;
    contract_start: string;
  };
  club?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export interface Club {
  id: string;
  name: string;
  balance: number;
  salaryCap: number;
  players: Player[];
  logo_url: string | null;
}

export interface Bid {
  id: string;
  bid_amount: number;
  created_at: string;
  club_id: string;
  club: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export interface Auction {
  id: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  starting_bid: number;
  current_bid: number;
  scheduled_start_time: string;
  countdown_minutes: number;
  player: Player;
  seller_club: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  current_bidder: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  bids: Bid[];
}
