-- Create transfer_requests table
CREATE TABLE IF NOT EXISTS transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS idx_transfer_requests_server_id ON transfer_requests(server_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_player_id ON transfer_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_from_club_id ON transfer_requests(from_club_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_to_club_id ON transfer_requests(to_club_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_created_at ON transfer_requests(created_at);

-- Add RLS policies
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view transfer requests related to their clubs
CREATE POLICY "Users can view transfer requests related to their clubs"
    ON transfer_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM server_members sm
            JOIN clubs c ON sm.club_id = c.id
            WHERE sm.user_id = auth.uid()
            AND (c.id = transfer_requests.from_club_id OR c.id = transfer_requests.to_club_id)
        )
    );

-- Policy to allow users to create transfer requests from their clubs
CREATE POLICY "Users can create transfer requests from their clubs"
    ON transfer_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM server_members sm
            JOIN clubs c ON sm.club_id = c.id
            WHERE sm.user_id = auth.uid()
            AND c.id = transfer_requests.to_club_id
        )
    );

-- Policy to allow users to update transfer requests related to their clubs
CREATE POLICY "Users can update transfer requests related to their clubs"
    ON transfer_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM server_members sm
            JOIN clubs c ON sm.club_id = c.id
            WHERE sm.user_id = auth.uid()
            AND (c.id = transfer_requests.from_club_id OR c.id = transfer_requests.to_club_id)
        )
    );

-- Policy to allow users to delete transfer requests they created
CREATE POLICY "Users can delete transfer requests they created"
    ON transfer_requests FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM server_members sm
            JOIN clubs c ON sm.club_id = c.id
            WHERE sm.user_id = auth.uid()
            AND c.id = transfer_requests.to_club_id
        )
    );

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transfer_requests_updated_at
    BEFORE UPDATE ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to process transfer request acceptance
CREATE OR REPLACE FUNCTION process_transfer_request_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    player_data RECORD;
    from_club_data RECORD;
    to_club_data RECORD;
    server_config RECORD;
    transfer_id UUID;
BEGIN
    -- Only process when status changes to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Get player data
        SELECT * INTO player_data FROM server_players WHERE id = NEW.player_id;
        
        -- Get club data
        SELECT * INTO from_club_data FROM clubs WHERE id = NEW.from_club_id;
        SELECT * INTO to_club_data FROM clubs WHERE id = NEW.to_club_id;
        
        -- Get server config
        SELECT * INTO server_config FROM servers WHERE id = NEW.server_id;
        
        -- Create transfer record
        INSERT INTO transfers (
            server_id,
            player_id,
            from_club_id,
            to_club_id,
            type,
            amount,
            status
        ) VALUES (
            NEW.server_id,
            NEW.player_id,
            NEW.from_club_id,
            NEW.to_club_id,
            'direct',
            NEW.amount,
            'completed'
        ) RETURNING id INTO transfer_id;
        
        -- Update player's club
        UPDATE server_players
        SET 
            club_id = NEW.to_club_id,
            contract = jsonb_build_object(
                'salary', player_data.contract->>'salary',
                'clause_value', NEW.amount * (server_config.auto_clause_percentage / 100),
                'contract_start', CURRENT_TIMESTAMP,
                'contract_end', (CURRENT_TIMESTAMP + INTERVAL '1 year')::text
            )
        WHERE id = NEW.player_id;
        
        -- Update club balances
        UPDATE clubs
        SET balance = balance - NEW.amount
        WHERE id = NEW.to_club_id;
        
        UPDATE clubs
        SET balance = balance + NEW.amount
        WHERE id = NEW.from_club_id;
        
        -- Record financial transactions
        INSERT INTO financial_transactions (
            club_id,
            type,
            category,
            amount,
            description
        ) VALUES (
            NEW.to_club_id,
            'expense',
            'transfer',
            NEW.amount,
            'Transferência de ' || player_data.name || ' de ' || from_club_data.name
        );
        
        INSERT INTO financial_transactions (
            club_id,
            type,
            category,
            amount,
            description
        ) VALUES (
            NEW.from_club_id,
            'income',
            'transfer',
            NEW.amount,
            'Transferência de ' || player_data.name || ' para ' || to_club_data.name
        );
        
        -- Create notifications
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            read
        ) VALUES (
            (SELECT user_id FROM clubs WHERE id = NEW.to_club_id),
            'transfer',
            'Transferência aceita',
            'Sua proposta de ' || NEW.amount || ' por ' || player_data.name || ' foi aceita por ' || from_club_data.name,
            jsonb_build_object(
                'transfer_id', transfer_id,
                'player_id', NEW.player_id,
                'player_name', player_data.name,
                'from_club_id', NEW.from_club_id,
                'from_club_name', from_club_data.name,
                'to_club_id', NEW.to_club_id,
                'to_club_name', to_club_data.name,
                'amount', NEW.amount
            ),
            false
        );
        
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            read
        ) VALUES (
            (SELECT user_id FROM clubs WHERE id = NEW.from_club_id),
            'transfer',
            'Transferência concluída',
            'Você vendeu ' || player_data.name || ' para ' || to_club_data.name || ' por ' || NEW.amount,
            jsonb_build_object(
                'transfer_id', transfer_id,
                'player_id', NEW.player_id,
                'player_name', player_data.name,
                'from_club_id', NEW.from_club_id,
                'from_club_name', from_club_data.name,
                'to_club_id', NEW.to_club_id,
                'to_club_name', to_club_data.name,
                'amount', NEW.amount
            ),
            false
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transfer request acceptance
CREATE TRIGGER transfer_request_accepted
    AFTER UPDATE ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION process_transfer_request_acceptance(); 