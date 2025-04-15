export interface Database {
  public: {
    Tables: {
      server_players: {
        Row: {
          id: string;
          server_id: string;
          name: string;
          age: number;
          nationality: string;
          position: string;
          overall: number;
          club_id: string | null;
          contract: {
            salary: number;
            clause_value: number;
            contract_start: string;
            contract_end: string;
          } | null;
          is_on_loan: boolean;
          loan_from_club_id: string | null;
          transfer_availability: "available" | "auction_only" | "unavailable";
          created_at: string;
          updated_at: string;
        };
      };
      clubs: {
        Row: {
          id: string;
          name: string;
          user_id: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
        };
      };
      servers: {
        Row: {
          id: string;
          market_value_multiplier: number;
          min_player_salary_percentage: number;
          max_player_salary_percentage: number;
          auto_clause_percentage: number;
        };
      };
      server_members: {
        Row: {
          id: string;
          user_id: string;
          server_id: string;
          club_id: string | null;
        };
      };
    };
  };
}
