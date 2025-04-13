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
  formation: z.string().regex(/^\d{1,2}-\d{1,2}-\d{1,2}$/),
  starting_ids: z.array(z.string().uuid()).min(11).max(11),
  bench_ids: z.array(z.string().uuid()).min(5).max(7),
  captain_id: z.string().uuid(),
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
