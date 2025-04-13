-- Create divisions table
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL,
    promotion_spots INTEGER NOT NULL DEFAULT 2,
    relegation_spots INTEGER NOT NULL DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(server_id, level)
);

-- Create promotion_relegation_history table
CREATE TABLE promotion_relegation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    from_division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    to_division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('promotion', 'relegation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add division_id to clubs table
ALTER TABLE clubs ADD COLUMN division_id UUID REFERENCES divisions(id) ON DELETE SET NULL;

-- Create RLS policies
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_relegation_history ENABLE ROW LEVEL SECURITY;

-- Divisions policies
CREATE POLICY "Divisions are viewable by server members" ON divisions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM server_members
            WHERE server_members.server_id = divisions.server_id
            AND server_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Divisions are editable by server admins" ON divisions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM server_members
            WHERE server_members.server_id = divisions.server_id
            AND server_members.user_id = auth.uid()
            AND server_members.role = 'admin'
        )
    );

-- Promotion/Relegation history policies
CREATE POLICY "History is viewable by server members" ON promotion_relegation_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM server_members
            WHERE server_members.server_id = promotion_relegation_history.server_id
            AND server_members.user_id = auth.uid()
        )
    );

CREATE POLICY "History is insertable by server admins" ON promotion_relegation_history
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM server_members
            WHERE server_members.server_id = promotion_relegation_history.server_id
            AND server_members.user_id = auth.uid()
            AND server_members.role = 'admin'
        )
    );

-- Create indexes
CREATE INDEX idx_divisions_server_id ON divisions(server_id);
CREATE INDEX idx_divisions_level ON divisions(level);
CREATE INDEX idx_promotion_relegation_history_server_id ON promotion_relegation_history(server_id);
CREATE INDEX idx_promotion_relegation_history_club_id ON promotion_relegation_history(club_id);
CREATE INDEX idx_promotion_relegation_history_season ON promotion_relegation_history(season);
CREATE INDEX idx_clubs_division_id ON clubs(division_id); 