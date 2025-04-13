# 📊 Footix - DATABASE

## 🔐 Autenticação

- **auth.users**: Gerenciado automaticamente pela Supabase Auth
- **users**:
  - id (UUID, PK, ref. auth.users)
  - email, name, avatar_url
  - created_at, updated_at

## 🚧 Infraestrutura de Servidor

### servers

- id (UUID, PK)
- name (text)
- status (`inscricao`, `andamento`, `finalizada`)
- season (int)
- max_members (int)
- current_members (int)
- registration_deadline (timestamp)
- season_length_days (int)
- entry_mode (`public`, `private`)
- current_season_start (timestamp)
- current_season_end (timestamp)
- registration_start (timestamp)
- transfer_window_open (boolean)
- transfer_window_start (timestamp)
- transfer_window_end (timestamp)

#### Orçamento e economia

- initial_budget (decimal)
- budget_growth_per_season (decimal)
- salary_cap (decimal)
- salary_cap_penalty_percentage (decimal)
- enable_monetization (boolean)

#### Regras de mercado e salários

- min_player_salary_percentage (int)
- max_player_salary_percentage (int)
- activate_clause (boolean)
- auto_clause_percentage (decimal)
- market_value_multiplier (decimal)

#### Simulação

- match_frequency_minutes (int)
- enable_auto_simulation (boolean)
- last_simulation (timestamp)
- next_simulation (timestamp)

#### Penalidades

- red_card_penalty (decimal)
- allow_penalty_waiver (boolean)

#### Referências

- players_source (UUID)
- admin_id (UUID, ref. auth.users)

#### Metadados

- created_at (timestamp)
- updated_at (timestamp)

### server_members

- id (UUID, PK)
- server_id (UUID, ref. servers)
- user_id (UUID, ref. users)
- club_id (UUID, ref. clubs)
- role (`owner`, `admin`)

## 🏠 Estrutura dos Clubes

### clubs

- id (UUID, PK)
- server_id (UUID, ref. servers)
- user_id (UUID, ref. users)
- name (text)
- logo_url (text)
- city (text)
- country (text)
- balance (decimal)
- season_budget_base (decimal)
- season_budget_bonus (decimal)
- season_expenses (decimal)
- division (text)
- reputation (int)
- fan_base (int)
- stadium_capacity (int)
- ticket_price (decimal)
- season_ticket_holders (int)
- created_at (timestamp)
- updated_at (timestamp)

### club_tactics

- id (UUID, PK)
- club_id (UUID, ref. clubs)
- formation (text)
- starting_ids (UUID[])
- bench_ids (UUID[])
- captain_id (UUID)

## 🏀 Jogadores

### global_players (base original)

- id (UUID, PK)
- name (text)
- age (int)
- nationality (text)
- position (text)
- attributes (jsonb)
- base_salary (decimal)
- base_value (decimal)

### server_players

- id (UUID, PK)
- player_base_id (UUID, ref. global_players)
- name (text)
- age (int)
- nationality (text)
- position (text)
- attributes (jsonb)
- contract (jsonb)
  - salary (decimal)
  - clause_value (decimal)
  - contract_start (timestamp)
  - contract_end (timestamp)
- club_id (UUID, ref. clubs)
- is_on_loan (boolean)
- loan_from_club_id (UUID, ref. clubs)
- morale (int)
- form (int)
- xp (int)
- level (int)
- is_star_player (boolean)

## 💰 Transferências e Leilões

### transfers

- id (UUID, PK)
- server_id (UUID, ref. servers)
- player_id (UUID, ref. server_players)
- from_club_id (UUID, ref. clubs)
- to_club_id (UUID, ref. clubs)
- type (text) CHECK (type IN ('direct', 'clause', 'free', 'auction'))
- amount (decimal)
- status (text) CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'))
- created_at (timestamp)
- updated_at (timestamp)

### auctions

- id (UUID, PK)
- server_id (UUID, ref. servers)
- player_id (UUID, ref. server_players)
- seller_club_id (UUID, ref. clubs)
- starting_bid (decimal)
- current_bid (decimal)
- current_bidder_id (UUID, ref. clubs)
- end_time (timestamp)
- status (text) CHECK (status IN ('active', 'ended', 'cancelled'))
- created_at (timestamp)
- updated_at (timestamp)

### penalties

- id (UUID, PK)
- server_id (UUID, ref. servers)
- club_id (UUID, ref. clubs)
- match_id (UUID, ref. matches)
- player_id (UUID, ref. server_players)
- type (text) CHECK (type IN ('red_card', 'salary_cap', 'other'))
- amount (decimal)
- status (text) CHECK (status IN ('pending', 'paid', 'waived'))
- description (text)
- created_at (timestamp)
- updated_at (timestamp)

## 🏋️ Competições

### competitions

- id (UUID, PK)
- server_id (UUID, ref. servers)
- name (text)
- type (text) CHECK (type IN ('league', 'cup', 'elite'))
- season (int)
- points_win (int)
- points_draw (int)
- tie_break_order (text[])
- reward_schema (jsonb)
- red_card_penalty (decimal)

### competition_clubs

- id (UUID, PK)
- competition_id (UUID, ref. competitions)
- club_id (UUID, ref. clubs)
- group (text)
- points (int)
- goals_for (int)
- goals_against (int)
- wins (int)
- draws (int)
- losses (int)

### matches

- id (UUID, PK)
- competition_id (UUID, ref. competitions)
- home_club_id (UUID, ref. clubs)
- away_club_id (UUID, ref. clubs)
- scheduled_at (timestamp)
- status (text)
- home_goals (int)
- away_goals (int)
- round (int)
- home_formation (text)
- away_formation (text)
- home_lineup (jsonb)
- away_lineup (jsonb)
- match_stats (jsonb)
- highlights (jsonb)
- events (jsonb)

## 🎓 Estatísticas e Histórico

### player_stats

- id (UUID, PK)
- player_id (UUID, ref. server_players)
- season (int)
- matches_played (int)
- goals (int)
- assists (int)
- clean_sheets (int)
- yellow_cards (int)
- red_cards (int)
- minutes_played (int)
- rating (decimal)

### season_logs

- id (UUID, PK)
- club_id (UUID, ref. clubs)
- server_id (UUID, ref. servers)
- season (int)
- final_position (int)
- financial_result (decimal)
- achievements (jsonb)

## 📢 Logs e Notificações

### admin_logs

- id (UUID, PK)
- server_id (UUID, ref. servers)
- type (text)
- message (text)
- created_at (timestamp)
- metadata (jsonb)

### notifications

- id (UUID, PK)
- user_id (UUID, ref. users)
- type (text) CHECK (type IN ('match', 'transfer', 'system', 'admin'))
- title (text)
- message (text)
- data (jsonb)
- read (boolean)
- created_at (timestamp)
