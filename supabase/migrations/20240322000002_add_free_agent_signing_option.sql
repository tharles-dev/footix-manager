-- Adicionar coluna para permitir contratação de jogadores livres fora da janela de transferências
ALTER TABLE servers
ADD COLUMN allow_free_agent_signing_outside_window BOOLEAN NOT NULL DEFAULT false;

-- Comentário para a coluna
COMMENT ON COLUMN servers.allow_free_agent_signing_outside_window IS 'Indica se é permitido contratar jogadores livres (sem contrato) mesmo quando a janela de transferências está fechada';

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
  
  -- Verificar se a janela de transferência está aberta ou se é permitido contratar jogadores livres
  IF NOT server_config.transfer_window_open AND 
     (NEW.from_club_id IS NOT NULL OR NOT server_config.allow_free_agent_signing_outside_window) THEN
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