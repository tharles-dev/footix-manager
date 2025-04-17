-- Função para processar o pagamento da multa rescisória
CREATE OR REPLACE FUNCTION pay_clause(
  p_player_id UUID,
  p_club_id UUID,
  p_server_id UUID,
  p_amount DECIMAL
) RETURNS void AS $$
DECLARE
  v_selling_club_id UUID;
  v_player_name TEXT;
  v_server_config RECORD;
BEGIN
  -- Buscar configurações do servidor
  SELECT * INTO v_server_config
  FROM servers
  WHERE id = p_server_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Servidor não encontrado';
  END IF;

  -- Buscar informações do jogador
  SELECT 
    club_id,
    name
  INTO 
    v_selling_club_id,
    v_player_name
  FROM server_players
  WHERE id = p_player_id
  AND server_id = p_server_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jogador não encontrado';
  END IF;

  -- Verificar se o jogador está contratado
  IF v_selling_club_id IS NULL THEN
    RAISE EXCEPTION 'Jogador não possui contrato';
  END IF;

  -- Verificar se o clube tem saldo suficiente
  IF NOT EXISTS (
    SELECT 1 FROM clubs 
    WHERE id = p_club_id 
    AND server_id = p_server_id
    AND balance >= p_amount
  ) THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  -- Iniciar transação
  BEGIN
    -- Atualizar saldo do clube comprador
    UPDATE clubs
    SET balance = balance - p_amount
    WHERE id = p_club_id
    AND server_id = p_server_id;

    -- Atualizar saldo do clube vendedor
    UPDATE clubs
    SET balance = balance + p_amount
    WHERE id = v_selling_club_id
    AND server_id = p_server_id;

    -- Atualizar contrato do jogador
    UPDATE server_players
    SET 
      club_id = p_club_id,
      contract = jsonb_build_object(
        'salary',
        CASE 
          WHEN v_server_config.market_value_multiplier = 0 THEN 0
          ELSE p_amount / v_server_config.market_value_multiplier
        END,
        'clause_value', p_amount * (v_server_config.auto_clause_percentage / 100),
        'contract_start', CURRENT_TIMESTAMP,
        'contract_end', (CURRENT_TIMESTAMP + INTERVAL '1 year')::text
      )
    WHERE id = p_player_id
    AND server_id = p_server_id;

    -- Registrar transferência
    INSERT INTO transfers (
      server_id,
      player_id,
      from_club_id,
      to_club_id,
      type,
      amount,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_server_id,
      p_player_id,
      v_selling_club_id,
      p_club_id,
      'clause',
      p_amount,
      'completed',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Erro ao processar pagamento: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql; 