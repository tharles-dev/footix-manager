-- Função para processar salários mensais
CREATE OR REPLACE FUNCTION process_monthly_salaries(
  p_club_id UUID,
  p_total_salaries DECIMAL,
  p_penalty_amount DECIMAL
) RETURNS void AS $$
DECLARE
  v_club_balance DECIMAL;
  v_server_id UUID;
  v_season INTEGER;
BEGIN
  -- Obtém informações do clube
  SELECT balance, server_id, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
  INTO v_club_balance, v_server_id, v_season
  FROM clubs
  WHERE id = p_club_id;

  -- Verifica se tem saldo suficiente
  IF v_club_balance < p_total_salaries THEN
    RAISE EXCEPTION 'Saldo insuficiente para pagar os salários';
  END IF;

  -- Inicia transação
  BEGIN
    -- Atualiza saldo do clube
    UPDATE clubs
    SET balance = balance - p_total_salaries
    WHERE id = p_club_id;

    -- Registra despesa de salários
    INSERT INTO expenses (
      club_id,
      amount,
      description,
      category,
      season
    ) VALUES (
      p_club_id,
      p_total_salaries,
      'Pagamento de salários mensais',
      'salary',
      v_season
    );

    -- Se houver multa por teto salarial, registra
    IF p_penalty_amount > 0 THEN
      -- Atualiza saldo do clube (deduz multa)
      UPDATE clubs
      SET balance = balance - p_penalty_amount
      WHERE id = p_club_id;

      -- Registra multa
      INSERT INTO penalties (
        server_id,
        club_id,
        type,
        amount,
        status,
        description
      ) VALUES (
        v_server_id,
        p_club_id,
        'salary_cap',
        p_penalty_amount,
        'pending',
        'Multa por ultrapassar teto salarial'
      );

      -- Registra despesa da multa
      INSERT INTO expenses (
        club_id,
        amount,
        description,
        category,
        season
      ) VALUES (
        p_club_id,
        p_penalty_amount,
        'Multa por teto salarial',
        'salary',
        v_season
      );
    END IF;

    -- Registra log de processamento
    INSERT INTO admin_logs (
      server_id,
      type,
      message,
      metadata
    ) VALUES (
      v_server_id,
      'salary_processing',
      'Processamento de salários mensais',
      jsonb_build_object(
        'club_id', p_club_id,
        'total_salaries', p_total_salaries,
        'penalty_amount', p_penalty_amount,
        'season', v_season
      )
    );

  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, faz rollback
    RAISE EXCEPTION 'Erro ao processar salários: %', SQLERRM;
  END;

END;
$$ LANGUAGE plpgsql; 