import { Player } from "./player";
import { Club } from "./club";

interface TransferPlayer extends Omit<Player, "contract"> {
  contract: {
    salary: number;
    clause_value?: number;
    contract_start: string;
    contract_end: string;
  };
}

export interface TransferOffer {
  id: string;
  player: TransferPlayer | null;
  from_club: Club | null;
  to_club: Club | null;
  amount: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface TransferOfferResponse {
  offers: TransferOffer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
