-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create servers table
CREATE TABLE servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT CHECK (status IN ('inscricao', 'andamento', 'finalizada')) NOT NULL DEFAULT 'inscricao',
    season INTEGER NOT NULL DEFAULT 1,
    max_members INTEGER NOT NULL DEFAULT 64,
    current_members INTEGER NOT NULL DEFAULT 0,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    season_length_days INTEGER NOT NULL DEFAULT 40,
    entry_mode TEXT CHECK (entry_mode IN ('public', 'private')) NOT NULL DEFAULT 'public',
    current_season_start TIMESTAMP WITH TIME ZONE,
    current_season_end TIMESTAMP WITH TIME ZONE,
    registration_start TIMESTAMP WITH TIME ZONE,
    transfer_window_open BOOLEAN NOT NULL DEFAULT false,
    transfer_window_start TIMESTAMP WITH TIME ZONE,
    transfer_window_end TIMESTAMP WITH TIME ZONE,
    
    -- Budget and economy
    initial_budget DECIMAL NOT NULL DEFAULT 5000000,
    budget_growth_per_season DECIMAL NOT NULL DEFAULT 0.1,
    salary_cap DECIMAL NOT NULL DEFAULT 3500000,
    salary_cap_penalty_percentage DECIMAL NOT NULL DEFAULT 0.1,
    enable_monetization BOOLEAN NOT NULL DEFAULT false,
    
    -- Market rules
    min_player_salary_percentage INTEGER NOT NULL DEFAULT 80,
    max_player_salary_percentage INTEGER NOT NULL DEFAULT 150,
    activate_clause BOOLEAN NOT NULL DEFAULT true,
    auto_clause_percentage DECIMAL NOT NULL DEFAULT 200,
    market_value_multiplier DECIMAL NOT NULL DEFAULT 24,
    
    -- Simulation
    match_frequency_minutes INTEGER NOT NULL DEFAULT 1440,
    enable_auto_simulation BOOLEAN NOT NULL DEFAULT true,
    last_simulation TIMESTAMP WITH TIME ZONE,
    next_simulation TIMESTAMP WITH TIME ZONE,
    
    -- Penalties
    red_card_penalty DECIMAL NOT NULL DEFAULT 1000,
    allow_penalty_waiver BOOLEAN NOT NULL DEFAULT true,
    
    -- References
    players_source UUID,
    admin_id UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create server_members table
CREATE TABLE server_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    club_id UUID,
    role TEXT CHECK (role IN ('owner', 'admin')) NOT NULL DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(server_id, user_id)
);

-- Create clubs table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    city TEXT,
    country TEXT,
    balance DECIMAL NOT NULL DEFAULT 0,
    season_budget_base DECIMAL NOT NULL DEFAULT 0,
    season_budget_bonus DECIMAL NOT NULL DEFAULT 0,
    season_expenses DECIMAL NOT NULL DEFAULT 0,
    division TEXT,
    reputation INTEGER NOT NULL DEFAULT 50,
    fan_base INTEGER NOT NULL DEFAULT 1000,
    stadium_capacity INTEGER NOT NULL DEFAULT 10000,
    ticket_price DECIMAL NOT NULL DEFAULT 10,
    season_ticket_holders INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(server_id, name)
);

-- Create club_tactics table
CREATE TABLE club_tactics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) NOT NULL,
    formation TEXT NOT NULL,
    starting_ids UUID[] NOT NULL,
    bench_ids UUID[] NOT NULL,
    captain_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create global_players table
CREATE TABLE global_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    nationality TEXT NOT NULL,
    position TEXT NOT NULL,
    attributes JSONB NOT NULL,
    base_salary DECIMAL NOT NULL,
    base_value DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create server_players table
CREATE TABLE server_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_base_id UUID REFERENCES global_players(id) NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    nationality TEXT NOT NULL,
    position TEXT NOT NULL,
    attributes JSONB NOT NULL,
    contract JSONB NOT NULL,
    club_id UUID REFERENCES clubs(id),
    is_on_loan BOOLEAN NOT NULL DEFAULT false,
    loan_from_club_id UUID REFERENCES clubs(id),
    morale INTEGER NOT NULL DEFAULT 50,
    form INTEGER NOT NULL DEFAULT 50,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    is_star_player BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create financial_transactions table
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create player_salaries table
CREATE TABLE player_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES server_players(id) NOT NULL,
    club_id UUID REFERENCES clubs(id) NOT NULL,
    base_salary DECIMAL NOT NULL,
    bonus_percentage DECIMAL NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create club_revenues table
CREATE TABLE club_revenues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) NOT NULL,
    season INTEGER NOT NULL,
    match_day_revenue DECIMAL NOT NULL DEFAULT 0,
    season_tickets_revenue DECIMAL NOT NULL DEFAULT 0,
    sponsorship_revenue DECIMAL NOT NULL DEFAULT 0,
    merchandise_revenue DECIMAL NOT NULL DEFAULT 0,
    transfer_revenue DECIMAL NOT NULL DEFAULT 0,
    other_revenue DECIMAL NOT NULL DEFAULT 0,
    total_revenue DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(club_id, season)
);

-- Create club_expenses table
CREATE TABLE club_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) NOT NULL,
    season INTEGER NOT NULL,
    wages_expense DECIMAL NOT NULL DEFAULT 0,
    facilities_expense DECIMAL NOT NULL DEFAULT 0,
    maintenance_expense DECIMAL NOT NULL DEFAULT 0,
    marketing_expense DECIMAL NOT NULL DEFAULT 0,
    transfer_expense DECIMAL NOT NULL DEFAULT 0,
    other_expense DECIMAL NOT NULL DEFAULT 0,
    total_expense DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(club_id, season)
);

-- Create playoffs table
CREATE TABLE playoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) NOT NULL,
    season INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) NOT NULL DEFAULT 'pending',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(server_id, season)
);

-- Create playoff_matches table
CREATE TABLE playoff_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playoff_id UUID REFERENCES playoffs(id) NOT NULL,
    round INTEGER NOT NULL,
    home_club_id UUID REFERENCES clubs(id) NOT NULL,
    away_club_id UUID REFERENCES clubs(id) NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    match_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed')) NOT NULL DEFAULT 'scheduled',
    winner_id UUID REFERENCES clubs(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_tactics ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoff_matches ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Servers policies
CREATE POLICY "Anyone can view public servers" ON servers
    FOR SELECT USING (entry_mode = 'public');

CREATE POLICY "Server members can view their servers" ON servers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM server_members
            WHERE server_id = servers.id
            AND user_id = auth.uid()
        )
    );

-- Server members policies
CREATE POLICY "Users can view their server memberships" ON server_members
    FOR SELECT USING (user_id = auth.uid());

-- Clubs policies
CREATE POLICY "Anyone can view clubs" ON clubs
    FOR SELECT USING (true);

CREATE POLICY "Club owners can update their clubs" ON clubs
    FOR UPDATE USING (user_id = auth.uid());

-- Club tactics policies
CREATE POLICY "Anyone can view club tactics" ON club_tactics
    FOR SELECT USING (true);

CREATE POLICY "Club owners can update their tactics" ON club_tactics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clubs
            WHERE clubs.id = club_tactics.club_id
            AND clubs.user_id = auth.uid()
        )
    );

-- Global players policies
CREATE POLICY "Anyone can view global players" ON global_players
    FOR SELECT USING (true);

-- Server players policies
CREATE POLICY "Anyone can view server players" ON server_players
    FOR SELECT USING (true);

-- Financial transactions policies
CREATE POLICY "Club owners can view financial transactions" ON financial_transactions
    FOR SELECT USING (club_id = auth.uid());

CREATE POLICY "Club owners can update financial transactions" ON financial_transactions
    FOR UPDATE USING (club_id = auth.uid());

-- Player salaries policies
CREATE POLICY "Club owners can view player salaries" ON player_salaries
    FOR SELECT USING (club_id = auth.uid());

CREATE POLICY "Club owners can update player salaries" ON player_salaries
    FOR UPDATE USING (club_id = auth.uid());

-- Club revenues policies
CREATE POLICY "Club owners can view club revenues" ON club_revenues
    FOR SELECT USING (club_id = auth.uid());

CREATE POLICY "Club owners can update club revenues" ON club_revenues
    FOR UPDATE USING (club_id = auth.uid());

-- Club expenses policies
CREATE POLICY "Club owners can view club expenses" ON club_expenses
    FOR SELECT USING (club_id = auth.uid());

CREATE POLICY "Club owners can update club expenses" ON club_expenses
    FOR UPDATE USING (club_id = auth.uid());

-- Playoffs policies
CREATE POLICY "Club owners can view playoffs" ON playoffs
    FOR SELECT USING (server_id = auth.uid());

CREATE POLICY "Club owners can update playoffs" ON playoffs
    FOR UPDATE USING (server_id = auth.uid());

-- Playoff matches policies
CREATE POLICY "Club owners can view playoff matches" ON playoff_matches
    FOR SELECT USING (playoff_id = auth.uid());

CREATE POLICY "Club owners can update playoff matches" ON playoff_matches
    FOR UPDATE USING (playoff_id = auth.uid());

-- Políticas RLS para financial_transactions
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver transações de seus clubes"
ON financial_transactions FOR SELECT
USING (
  club_id IN (
    SELECT id FROM clubs 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Apenas administradores podem inserir transações"
ON financial_transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = auth.uid() AND sm.role = 'admin'
  )
);

-- Políticas RLS para player_salaries
ALTER TABLE player_salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver salários de seus clubes"
ON player_salaries FOR SELECT
USING (
  club_id IN (
    SELECT id FROM clubs 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Apenas administradores podem gerenciar salários"
ON player_salaries FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = auth.uid() AND sm.role = 'admin'
  )
);

-- Políticas RLS para club_revenues
ALTER TABLE club_revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver receitas de seus clubes"
ON club_revenues FOR SELECT
USING (
  club_id IN (
    SELECT id FROM clubs 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Apenas administradores podem gerenciar receitas"
ON club_revenues FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = auth.uid() AND sm.role = 'admin'
  )
);

-- Políticas RLS para club_expenses
ALTER TABLE club_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver despesas de seus clubes"
ON club_expenses FOR SELECT
USING (
  club_id IN (
    SELECT id FROM clubs 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Apenas administradores podem gerenciar despesas"
ON club_expenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = auth.uid() AND sm.role = 'admin'
  )
);

-- Políticas RLS para playoffs
ALTER TABLE playoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver playoffs"
ON playoffs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas administradores podem gerenciar playoffs"
ON playoffs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = auth.uid() AND sm.role = 'admin'
  )
);

-- Políticas RLS para playoff_matches
ALTER TABLE playoff_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver partidas de playoffs"
ON playoff_matches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas administradores podem gerenciar partidas de playoffs"
ON playoff_matches FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = auth.uid() AND sm.role = 'admin'
  )
);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_servers_updated_at
    BEFORE UPDATE ON servers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_server_members_updated_at
    BEFORE UPDATE ON server_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_club_tactics_updated_at
    BEFORE UPDATE ON club_tactics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_global_players_updated_at
    BEFORE UPDATE ON global_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_server_players_updated_at
    BEFORE UPDATE ON server_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_player_salaries_updated_at
    BEFORE UPDATE ON player_salaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_club_revenues_updated_at
    BEFORE UPDATE ON club_revenues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_club_expenses_updated_at
    BEFORE UPDATE ON club_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_playoffs_updated_at
    BEFORE UPDATE ON playoffs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_playoff_matches_updated_at
    BEFORE UPDATE ON playoff_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at(); 