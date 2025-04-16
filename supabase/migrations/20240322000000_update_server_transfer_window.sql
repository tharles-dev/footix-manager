-- Remover colunas antigas de janela de transferência
ALTER TABLE servers
DROP COLUMN IF EXISTS transfer_window_start,
DROP COLUMN IF EXISTS transfer_window_end,
DROP COLUMN IF EXISTS current_season_start,
DROP COLUMN IF EXISTS current_season_end;

-- Adicionar nova coluna para janela de transferência de jogadores livres
ALTER TABLE servers
ADD COLUMN transfer_window_open BOOLEAN NOT NULL DEFAULT false;

-- Comentário para a coluna
COMMENT ON COLUMN servers.transfer_window_open IS 'Indica se a janela de transferência para jogadores livres (sem contrato) está aberta';

-- Atualizar a função de verificação de janela de transferência
CREATE OR REPLACE FUNCTION check_transfer_window()
RETURNS TRIGGER AS $$
DECLARE
  server_config RECORD;
  club_data RECORD;
  player_data RECORD;
  market_value NUMERIC;
  salary_cap NUMERIC;
  current_total_salaries NUMERIC;
  total_salaries NUMERIC;
BEGIN
  -- Obter configurações do servidor
  SELECT * INTO server_config FROM servers WHERE id = NEW.server_id;
  
  -- Verificar se a janela de transferência está aberta
  IF NOT server_config.transfer_window_open THEN
    RAISE EXCEPTION 'Janela de transferência fechada';
  END IF;
  
  -- Obter dados do clube
  SELECT * INTO club_data FROM clubs WHERE id = NEW.to_club_id;
  
  -- Obter dados do jogador
  SELECT * INTO player_data FROM server_players WHERE id = NEW.player_id;
  
  -- Calcular valor de mercado
  market_value := NEW.amount;
  
  -- Verificar se o clube tem saldo suficiente
  IF club_data.balance < market_value THEN
    RAISE EXCEPTION 'Saldo insuficiente para contratar o jogador';
  END IF;
  
  -- Calcular teto salarial
  salary_cap := club_data.season_budget_base * (server_config.salary_cap / 100);
  
  -- Calcular total de salários atuais
  SELECT COALESCE(SUM((contract->>'salary')::NUMERIC), 0) 
  INTO current_total_salaries 
  FROM server_players 
  WHERE club_id = NEW.to_club_id;
  
  -- Calcular total de salários com o novo jogador
  total_salaries := current_total_salaries + (player_data.contract->>'salary')::NUMERIC;
  
  -- Verificar se o novo salário excederia o teto
  IF total_salaries > salary_cap THEN
    RAISE EXCEPTION 'Contratação excederia o teto salarial do clube';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger se ele já existir
DROP TRIGGER IF EXISTS check_transfer_window_trigger ON transfers;
CREATE TRIGGER check_transfer_window_trigger
BEFORE INSERT ON transfers
FOR EACH ROW
EXECUTE FUNCTION check_transfer_window(); 