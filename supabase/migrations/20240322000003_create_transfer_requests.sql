-- Create transfer_requests table
CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES server_players(id) ON DELETE CASCADE,
    from_club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    to_club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_transfer_requests_server_id ON transfer_requests(server_id);
CREATE INDEX idx_transfer_requests_player_id ON transfer_requests(player_id);
CREATE INDEX idx_transfer_requests_from_club_id ON transfer_requests(from_club_id);
CREATE INDEX idx_transfer_requests_to_club_id ON transfer_requests(to_club_id);
CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX idx_transfer_requests_created_at ON transfer_requests(created_at);

-- Enable RLS
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Transfer requests are viewable by involved clubs" ON transfer_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM server_members sm
            WHERE sm.server_id = transfer_requests.server_id
            AND sm.user_id = auth.uid()
            AND (
                sm.club_id = transfer_requests.from_club_id
                OR sm.club_id = transfer_requests.to_club_id
            )
        )
    );

CREATE POLICY "Transfer requests can be created by club members" ON transfer_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM server_members sm
            WHERE sm.server_id = transfer_requests.server_id
            AND sm.user_id = auth.uid()
            AND sm.club_id = transfer_requests.to_club_id
        )
    );

CREATE POLICY "Transfer requests can be updated by involved clubs" ON transfer_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM server_members sm
            WHERE sm.server_id = transfer_requests.server_id
            AND sm.user_id = auth.uid()
            AND (
                sm.club_id = transfer_requests.from_club_id
                OR sm.club_id = transfer_requests.to_club_id
            )
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transfer_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transfer_request_updated_at
    BEFORE UPDATE ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_transfer_request_updated_at(); 