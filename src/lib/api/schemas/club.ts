import { z } from "zod";

// Schema para criação de clube
export const createClubSchema = z.object({
  name: z.string().min(3).max(50),
  city: z.string().min(2).max(50),
  country: z.string().min(2).max(50),
  logo_url: z.string().url().optional(),
  server_id: z.string().uuid(),
});

// Schema para atualização de tática
export const updateTacticsSchema = z.object({
  formation: z.string(),
  starting_ids: z.array(z.string().uuid()),
  bench_ids: z.array(z.string().uuid()),
  captain_id: z.string().uuid(),
  free_kick_taker_id: z.string().uuid().optional(),
  penalty_taker_id: z.string().uuid().optional(),
  play_style: z.enum(["equilibrado", "contra-ataque", "ataque total"]),
  marking: z.enum(["leve", "pesada", "muito pesada"]),
  server_id: z.string().uuid(),
});

// Schema para contratação de jogador
export const hirePlayerSchema = z.object({
  player_id: z.string().uuid(),
  salary: z.number().min(0),
  contract_years: z.number().min(1).max(5),
});

// Schema para venda de jogador
export const sellPlayerSchema = z.object({
  player_id: z.string().uuid(),
  price: z.number().min(0),
  buyer_club_id: z.string().uuid(),
});

// Schema para empréstimo de jogador
export const loanPlayerSchema = z.object({
  player_id: z.string().uuid(),
  receiving_club_id: z.string().uuid(),
  loan_fee: z.number().min(0),
  salary_percentage: z.number().min(0).max(100),
  duration_months: z.number().min(1).max(12),
});

// Schema para renovação de contrato
export const renewContractSchema = z.object({
  player_id: z.string().uuid(),
  new_salary: z.number().min(0),
  new_years: z.number().min(1).max(5),
});

// Schema para rescisão de contrato
export const terminateContractSchema = z.object({
  player_id: z.string().uuid(),
  reason: z.string().min(10).max(200),
});

export const addPlayerSchema = z.object({
  player_id: z.string().uuid(),
  number: z.number().int().min(1).max(99),
});

// Schema para ajuste de preço de ingresso
export const updateTicketPriceSchema = z.object({
  ticket_price: z.number().min(1).max(1000),
});

// Schema para ajuste de capacidade do estádio
export const updateStadiumCapacitySchema = z.object({
  stadium_capacity: z.number().min(1000).max(100000),
});

// Schema para ajuste de preço de sócio-torcedor
export const updateSeasonTicketPriceSchema = z.object({
  season_ticket_price: z.number().min(10).max(1000),
});

// Schema para pagamento de multa
export const payPenaltySchema = z.object({
  penalty_id: z.string().uuid(),
});

// Schema para solicitação de empréstimo
export const requestLoanSchema = z.object({
  amount: z.number().min(100000).max(10000000),
  duration_months: z.number().min(3).max(12),
});

// Schema para pagamento de parcela
export const payLoanSchema = z.object({
  loan_id: z.string().uuid(),
});

// Schema para atualização de orçamento
export const updateBudgetSchema = z.object({
  season_budget_base: z.number().min(1000000).max(100000000),
  season_budget_bonus: z.number().min(0).max(50000000),
  ticket_price: z.number().min(10).max(1000),
  season_ticket_price: z.number().min(100).max(10000),
});

// Schema para registro de despesa
export const addExpenseSchema = z.object({
  amount: z.number().min(1000),
  description: z.string().min(3).max(200),
  category: z.enum(["salary", "facilities", "marketing", "other"]),
});

// Schema para registro de receita
export const addRevenueSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(3).max(255),
  category: z.enum(["ticket_sales", "merchandise", "sponsorship", "other"]),
});

// Schema para criação do pack inicial
export const initialPackSchema = z.object({
  club_id: z.string().uuid(),
  server_id: z.string().uuid(),
});
