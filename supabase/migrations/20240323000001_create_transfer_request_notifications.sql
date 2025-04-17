-- Create function to send notifications for new transfer requests
CREATE OR REPLACE FUNCTION notify_new_transfer_request()
RETURNS TRIGGER AS $$
DECLARE
    player_data RECORD;
    from_club_data RECORD;
    to_club_data RECORD;
BEGIN
    -- Get player data
    SELECT * INTO player_data FROM server_players WHERE id = NEW.player_id;
    
    -- Get club data
    SELECT * INTO from_club_data FROM clubs WHERE id = NEW.from_club_id;
    SELECT * INTO to_club_data FROM clubs WHERE id = NEW.to_club_id;
    
    -- Create notification for the selling club
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
        'Nova proposta de transferência',
        to_club_data.name || ' ofereceu ' || NEW.amount || ' por ' || player_data.name,
        jsonb_build_object(
            'transfer_request_id', NEW.id,
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new transfer requests
CREATE TRIGGER transfer_request_created
    AFTER INSERT ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_transfer_request(); 