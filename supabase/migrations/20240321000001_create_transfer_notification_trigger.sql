-- Create function for transfer notifications
CREATE OR REPLACE FUNCTION notify_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a transferência foi criada
  IF TG_OP = 'INSERT' THEN
    -- Notificar clube de origem
    INSERT INTO notifications (
      user_id, type, title, message, data
    )
    SELECT 
      u.id, 'transfer', 'Nova oferta de transferência',
      'Seu clube recebeu uma oferta de ' || NEW.amount || ' por ' || 
      (SELECT name FROM server_players WHERE id = NEW.player_id),
      jsonb_build_object(
        'transfer_id', NEW.id,
        'player_id', NEW.player_id,
        'from_club_id', NEW.from_club_id,
        'to_club_id', NEW.to_club_id,
        'amount', NEW.amount
      )
    FROM users u
    JOIN server_members sm ON u.id = sm.user_id
    WHERE sm.club_id = NEW.from_club_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transfer notifications
CREATE TRIGGER transfer_notification
  AFTER INSERT ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION notify_transfer(); 