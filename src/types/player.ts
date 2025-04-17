export interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  club_id?: string;
  contract?: {
    salary: number;
    clause_value: number;
    contract_start: string;
    contract_end: string;
  };
}
