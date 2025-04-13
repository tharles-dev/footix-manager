import { z } from "zod";

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  avatar_url: z.string().url().optional(),
});

// Club schemas
export const clubSchema = z.object({
  id: z.string().uuid(),
  server_id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  logo_url: z.string().url().optional(),
  city: z.string().min(2).max(100).optional(),
  country: z.string().min(2).max(100).optional(),
  balance: z.number().min(0),
  season_budget_base: z.number().min(0),
  season_budget_bonus: z.number().min(0),
  season_expenses: z.number().min(0),
  division: z.string().optional(),
  reputation: z.number().min(0).max(100),
  fan_base: z.number().min(0),
  stadium_capacity: z.number().min(0),
  ticket_price: z.number().min(0),
  season_ticket_holders: z.number().min(0),
});

// Server schemas
export const serverSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  status: z.enum(["inscricao", "andamento", "finalizada"]),
  season: z.number().min(1),
  max_members: z.number().min(1).max(64),
  current_members: z.number().min(0),
  registration_deadline: z.string().datetime().optional(),
  season_length_days: z.number().min(1),
  entry_mode: z.enum(["public", "private"]),
  current_season_start: z.string().datetime().optional(),
  current_season_end: z.string().datetime().optional(),
  registration_start: z.string().datetime().optional(),
  transfer_window_open: z.boolean(),
  transfer_window_start: z.string().datetime().optional(),
  transfer_window_end: z.string().datetime().optional(),
});

// Request schemas
export const createClubSchema = z.object({
  name: z.string().min(2).max(100),
  logo_url: z.string().url().optional(),
  city: z.string().min(2).max(100).optional(),
  country: z.string().min(2).max(100).optional(),
});

export const updateClubSchema = createClubSchema.partial();

export const createServerSchema = z.object({
  name: z.string().min(2).max(100),
  max_members: z.number().min(1).max(64),
  initial_budget: z.number().min(0),
  budget_growth_per_season: z.number().min(0),
  salary_cap: z.number().min(0),
  salary_cap_penalty_percentage: z.number().min(0),
  min_player_salary_percentage: z.number().min(0),
  max_player_salary_percentage: z.number().min(0),
  activate_clause: z.boolean(),
  auto_clause_percentage: z.number().min(0),
  market_value_multiplier: z.number().min(0),
  enable_monetization: z.boolean(),
  match_frequency_minutes: z.number().min(1),
  enable_auto_simulation: z.boolean(),
});
