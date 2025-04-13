-- Função para processar premiações de uma competição
CREATE OR REPLACE FUNCTION process_competition_rewards(
  p_competition_id UUID
) RETURNS VOID AS $$
DECLARE
  v_competition RECORD;
  v_club RECORD;
  v_player RECORD;
  v_reward_schema JSONB;
  v_position INTEGER;
  v_reward_amount DECIMAL;
BEGIN
  -- Buscar dados da competição
  SELECT * INTO v_competition
  FROM competitions
  WHERE id = p_competition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competição não encontrada';
  END IF;

  -- Verificar se já existem premiações processadas
  IF EXISTS (
    SELECT 1 FROM financial_transactions
    WHERE competition_id = p_competition_id
    AND category = 'competition_reward'
  ) THEN
    RAISE EXCEPTION 'Premiações já foram processadas para esta competição';
  END IF;

  -- Obter esquema de premiações
  v_reward_schema := v_competition.reward_schema;

  -- Processar premiações por posição
  FOR v_position IN 1..4 LOOP
    -- Buscar clube na posição
    SELECT c.* INTO v_club
    FROM clubs c
    JOIN competition_clubs cc ON c.id = cc.club_id
    WHERE cc.competition_id = p_competition_id
    ORDER BY cc.points DESC,
             (cc.goals_for - cc.goals_against) DESC,
             cc.goals_for DESC
    OFFSET v_position - 1
    LIMIT 1;

    IF FOUND AND v_reward_schema->'positions'->v_position::TEXT IS NOT NULL THEN
      v_reward_amount := (v_reward_schema->'positions'->v_position::TEXT)::DECIMAL;
      
      -- Atualizar saldo do clube
      UPDATE clubs
      SET balance = balance + v_reward_amount
      WHERE id = v_club.id;

      -- Registrar transação
      INSERT INTO financial_transactions (
        club_id,
        competition_id,
        type,
        category,
        amount,
        description
      ) VALUES (
        v_club.id,
        p_competition_id,
        'income',
        'competition_reward',
        v_reward_amount,
        'Premiação por posição ' || v_position || ' na competição'
      );
    END IF;
  END LOOP;

  -- Processar artilheiro
  IF v_reward_schema->'top_scorer' IS NOT NULL THEN
    -- Buscar artilheiro
    SELECT p.* INTO v_player
    FROM server_players p
    JOIN matches m ON m.competition_id = p_competition_id
    WHERE m.status = 'completed'
    AND m.match_stats->'players'->p.id->>'goals' IS NOT NULL
    GROUP BY p.id
    ORDER BY SUM((m.match_stats->'players'->p.id->>'goals')::INTEGER) DESC
    LIMIT 1;

    IF FOUND THEN
      v_reward_amount := (v_reward_schema->'top_scorer')::DECIMAL;
      
      -- Atualizar saldo do clube
      UPDATE clubs
      SET balance = balance + v_reward_amount
      WHERE id = v_player.club_id;

      -- Registrar transação
      INSERT INTO financial_transactions (
        club_id,
        competition_id,
        type,
        category,
        amount,
        description
      ) VALUES (
        v_player.club_id,
        p_competition_id,
        'income',
        'competition_reward',
        v_reward_amount,
        'Premiação de artilheiro da competição'
      );
    END IF;
  END IF;

  -- Processar melhor assistente
  IF v_reward_schema->'top_assister' IS NOT NULL THEN
    -- Buscar melhor assistente
    SELECT p.* INTO v_player
    FROM server_players p
    JOIN matches m ON m.competition_id = p_competition_id
    WHERE m.status = 'completed'
    AND m.match_stats->'players'->p.id->>'assists' IS NOT NULL
    GROUP BY p.id
    ORDER BY SUM((m.match_stats->'players'->p.id->>'assists')::INTEGER) DESC
    LIMIT 1;

    IF FOUND THEN
      v_reward_amount := (v_reward_schema->'top_assister')::DECIMAL;
      
      -- Atualizar saldo do clube
      UPDATE clubs
      SET balance = balance + v_reward_amount
      WHERE id = v_player.club_id;

      -- Registrar transação
      INSERT INTO financial_transactions (
        club_id,
        competition_id,
        type,
        category,
        amount,
        description
      ) VALUES (
        v_player.club_id,
        p_competition_id,
        'income',
        'competition_reward',
        v_reward_amount,
        'Premiação de melhor assistente da competição'
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql; 