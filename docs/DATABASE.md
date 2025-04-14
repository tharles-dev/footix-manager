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
- overall (int)
- potential (int)
- pace (int)
- shooting (int)
- passing (int)
- dribbling (int)
- defending (int)
- physical (int)
- base_salary (decimal)
- base_value (decimal)

### server_players

- id (UUID, PK)
- player_base_id (UUID, ref. global_players)
- name (text)
- age (int)
- nationality (text)
- position (text)
- overall (int)
- potential (int)
- pace (int)
- shooting (int)
- passing (int)
- dribbling (int)
- defending (int)
- physical (int)
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

## Tabelas de Finanças

### financial_transactions

Registra todas as transações financeiras dos clubes.

| Campo            | Tipo      | Descrição                                 |
| ---------------- | --------- | ----------------------------------------- |
| id               | UUID      | Identificador único da transação          |
| club_id          | UUID      | ID do clube (referência à tabela clubs)   |
| type             | TEXT      | Tipo da transação ('income' ou 'expense') |
| category         | TEXT      | Categoria da transação                    |
| amount           | DECIMAL   | Valor da transação                        |
| description      | TEXT      | Descrição opcional da transação           |
| transaction_date | TIMESTAMP | Data da transação                         |
| created_at       | TIMESTAMP | Data de criação do registro               |
| updated_at       | TIMESTAMP | Data da última atualização                |

### player_salaries

Gerencia os salários dos jogadores.

| Campo            | Tipo      | Descrição                                          |
| ---------------- | --------- | -------------------------------------------------- |
| id               | UUID      | Identificador único do registro de salário         |
| player_id        | UUID      | ID do jogador (referência à tabela server_players) |
| club_id          | UUID      | ID do clube (referência à tabela clubs)            |
| base_salary      | DECIMAL   | Salário base do jogador                            |
| bonus_percentage | DECIMAL   | Percentual de bônus por desempenho                 |
| start_date       | TIMESTAMP | Data de início do contrato                         |
| end_date         | TIMESTAMP | Data de término do contrato                        |
| is_active        | BOOLEAN   | Indica se o contrato está ativo                    |
| created_at       | TIMESTAMP | Data de criação do registro                        |
| updated_at       | TIMESTAMP | Data da última atualização                         |

### club_revenues

Controla as receitas dos clubes por temporada.

| Campo                  | Tipo      | Descrição                                   |
| ---------------------- | --------- | ------------------------------------------- |
| id                     | UUID      | Identificador único do registro de receitas |
| club_id                | UUID      | ID do clube (referência à tabela clubs)     |
| season                 | INTEGER   | Temporada                                   |
| match_day_revenue      | DECIMAL   | Receita com ingressos de jogos              |
| season_tickets_revenue | DECIMAL   | Receita com ingressos de temporada          |
| sponsorship_revenue    | DECIMAL   | Receita com patrocínios                     |
| merchandise_revenue    | DECIMAL   | Receita com merchandising                   |
| transfer_revenue       | DECIMAL   | Receita com transferências                  |
| other_revenue          | DECIMAL   | Outras receitas                             |
| total_revenue          | DECIMAL   | Total de receitas                           |
| created_at             | TIMESTAMP | Data de criação do registro                 |
| updated_at             | TIMESTAMP | Data da última atualização                  |

### club_expenses

Controla as despesas dos clubes por temporada.

| Campo               | Tipo      | Descrição                                   |
| ------------------- | --------- | ------------------------------------------- |
| id                  | UUID      | Identificador único do registro de despesas |
| club_id             | UUID      | ID do clube (referência à tabela clubs)     |
| season              | INTEGER   | Temporada                                   |
| wages_expense       | DECIMAL   | Despesa com salários                        |
| facilities_expense  | DECIMAL   | Despesa com instalações                     |
| maintenance_expense | DECIMAL   | Despesa com manutenção                      |
| marketing_expense   | DECIMAL   | Despesa com marketing                       |
| transfer_expense    | DECIMAL   | Despesa com transferências                  |
| other_expense       | DECIMAL   | Outras despesas                             |
| total_expense       | DECIMAL   | Total de despesas                           |
| created_at          | TIMESTAMP | Data de criação do registro                 |
| updated_at          | TIMESTAMP | Data da última atualização                  |

## Tabelas de Playoffs

### playoffs

Gerencia os playoffs do servidor.

| Campo      | Tipo      | Descrição                                                 |
| ---------- | --------- | --------------------------------------------------------- |
| id         | UUID      | Identificador único do playoff                            |
| server_id  | UUID      | ID do servidor (referência à tabela servers)              |
| season     | INTEGER   | Temporada                                                 |
| status     | TEXT      | Status do playoff ('pending', 'in_progress', 'completed') |
| start_date | TIMESTAMP | Data de início                                            |
| end_date   | TIMESTAMP | Data de término                                           |
| created_at | TIMESTAMP | Data de criação do registro                               |
| updated_at | TIMESTAMP | Data da última atualização                                |

### playoff_matches

Gerencia as partidas dos playoffs.

| Campo        | Tipo      | Descrição                                                   |
| ------------ | --------- | ----------------------------------------------------------- |
| id           | UUID      | Identificador único da partida                              |
| playoff_id   | UUID      | ID do playoff (referência à tabela playoffs)                |
| round        | INTEGER   | Rodada do playoff                                           |
| home_club_id | UUID      | ID do clube mandante (referência à tabela clubs)            |
| away_club_id | UUID      | ID do clube visitante (referência à tabela clubs)           |
| home_score   | INTEGER   | Placar do mandante                                          |
| away_score   | INTEGER   | Placar do visitante                                         |
| match_date   | TIMESTAMP | Data da partida                                             |
| status       | TEXT      | Status da partida ('scheduled', 'in_progress', 'completed') |
| winner_id    | UUID      | ID do clube vencedor (referência à tabela clubs)            |
| created_at   | TIMESTAMP | Data de criação do registro                                 |
| updated_at   | TIMESTAMP | Data da última atualização                                  |

### Tabelas de Divisões

#### divisions

Gerencia as divisões dos clubes.

| Campo            | Tipo      | Descrição                               |
| ---------------- | --------- | --------------------------------------- |
| id               | uuid      | ID único da divisão                     |
| server_id        | uuid      | ID do servidor                          |
| name             | varchar   | Nome da divisão                         |
| level            | integer   | Nível da divisão (1 = primeira divisão) |
| promotion_spots  | integer   | Número de vagas para promoção           |
| relegation_spots | integer   | Número de vagas para rebaixamento       |
| created_at       | timestamp | Data de criação                         |
| updated_at       | timestamp | Data de atualização                     |

#### promotion_relegation_history

Registra o histórico de promoções e rebaixamentos.

| Campo            | Tipo      | Descrição                                       |
| ---------------- | --------- | ----------------------------------------------- |
| id               | uuid      | ID único do registro                            |
| server_id        | uuid      | ID do servidor                                  |
| club_id          | uuid      | ID do clube                                     |
| season           | integer   | Temporada                                       |
| from_division_id | uuid      | ID da divisão de origem                         |
| to_division_id   | uuid      | ID da divisão de destino                        |
| type             | varchar   | Tipo do movimento ('promotion' ou 'relegation') |
| created_at       | timestamp | Data de criação                                 |
