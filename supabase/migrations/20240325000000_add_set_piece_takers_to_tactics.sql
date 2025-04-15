-- Adiciona campos de cobrador de falta e pênalti à tabela club_tactics
ALTER TABLE club_tactics
ADD COLUMN free_kick_taker_id UUID REFERENCES server_players(id),
ADD COLUMN penalty_taker_id UUID REFERENCES server_players(id);

-- Adiciona comentários aos novos campos
COMMENT ON COLUMN club_tactics.free_kick_taker_id IS 'ID do jogador responsável por cobrar faltas';
COMMENT ON COLUMN club_tactics.penalty_taker_id IS 'ID do jogador responsável por cobrar pênaltis';

-- Adiciona índices para melhorar a performance das consultas
CREATE INDEX idx_club_tactics_free_kick_taker ON club_tactics(free_kick_taker_id);
CREATE INDEX idx_club_tactics_penalty_taker ON club_tactics(penalty_taker_id);

-- Adiciona trigger para validar se os cobradores pertencem ao clube
CREATE OR REPLACE FUNCTION validate_set_piece_takers()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o cobrador de falta pertence ao clube
  IF NEW.free_kick_taker_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM server_players
      WHERE id = NEW.free_kick_taker_id
      AND club_id = NEW.club_id
    ) THEN
      RAISE EXCEPTION 'O cobrador de falta deve pertencer ao clube';
    END IF;
  END IF;

  -- Verifica se o cobrador de pênalti pertence ao clube
  IF NEW.penalty_taker_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM server_players
      WHERE id = NEW.penalty_taker_id
      AND club_id = NEW.club_id
    ) THEN
      RAISE EXCEPTION 'O cobrador de pênalti deve pertencer ao clube';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_set_piece_takers_trigger
BEFORE INSERT OR UPDATE ON club_tactics
FOR EACH ROW
EXECUTE FUNCTION validate_set_piece_takers(); 