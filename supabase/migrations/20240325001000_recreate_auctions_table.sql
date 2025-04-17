-- Drop existing auctions table if exists
DROP TABLE IF EXISTS auctions CASCADE;

-- Create auctions table
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES server_players(id) ON DELETE CASCADE,
    seller_club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    starting_bid DECIMAL NOT NULL,
    current_bid DECIMAL NOT NULL,
    current_bidder_id UUID REFERENCES clubs(id),
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
    is_scheduled BOOLEAN NOT NULL DEFAULT false,
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    countdown_minutes INTEGER NOT NULL DEFAULT 10,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_auctions_server_id ON auctions(server_id);
CREATE INDEX idx_auctions_player_id ON auctions(player_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);

-- Add trigger to update updated_at
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON auctions
    FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp(); 