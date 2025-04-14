-- Função para gerar o pack inicial de jogadores
CREATE OR REPLACE FUNCTION generate_initial_player_pack(
  p_club_id UUID,
  p_server_id UUID
) RETURNS SETOF server_players AS $$
DECLARE
  v_positions TEXT[] := ARRAY['GK', 'RMF', 'DMF', 'CB', 'CF', 'LB', 'RB', 'AMF', 'RWF', 'SS', 'LWF', 'LMF', 'CMF'];
  v_position_counts JSONB := '{}';
  v_position_targets JSONB := '{
    "GK": 2,
    "CB": 3,
    "LB": 2,
    "RB": 2,
    "DMF": 2,
    "CMF": 2,
    "RMF": 1,
    "LMF": 1,
    "AMF": 2,
    "CF": 2,
    "RWF": 1,
    "LWF": 1,
    "SS": 1
  }';
  v_position TEXT;
  v_player RECORD;
  v_available_positions TEXT[];
  v_selected_players UUID[] := '{}';
BEGIN
  -- Selecionar 6 jogadores de baixo tier (60-64 overall)
  FOR i IN 1..6 LOOP
    -- Selecionar posições que ainda não atingiram o alvo
    v_available_positions := ARRAY(
      SELECT pos
      FROM jsonb_object_keys(v_position_targets) pos
      WHERE (v_position_counts->pos)::int < (v_position_targets->pos)::int
    );
    
    -- Se não houver posições disponíveis, selecionar aleatoriamente
    IF array_length(v_available_positions, 1) IS NULL THEN
      v_position := v_positions[1 + floor(random() * array_length(v_positions, 1))::int];
    ELSE
      v_position := v_available_positions[1 + floor(random() * array_length(v_available_positions, 1))::int];
    END IF;
    
    -- Selecionar jogador aleatório da posição e overall desejado
    SELECT *
    FROM server_players
    WHERE server_id = p_server_id
      AND club_id IS NULL
      AND position = v_position
      AND overall BETWEEN 60 AND 64
      AND id != ALL(v_selected_players)
    ORDER BY random()
    LIMIT 1
    INTO v_player;
    
    -- Atualizar contagem de posições
    v_position_counts := v_position_counts || jsonb_build_object(
      v_position, 
      COALESCE((v_position_counts->v_position)::int, 0) + 1
    );
    
    -- Atualizar jogador selecionado
    UPDATE server_players
    SET club_id = p_club_id,
        is_star_player = overall > 85
    WHERE id = v_player.id;
    
    v_selected_players := array_append(v_selected_players, v_player.id);
    RETURN NEXT v_player;
  END LOOP;

  -- Selecionar 6 jogadores de médio tier (65-69 overall)
  FOR i IN 1..6 LOOP
    v_available_positions := ARRAY(
      SELECT pos
      FROM jsonb_object_keys(v_position_targets) pos
      WHERE (v_position_counts->pos)::int < (v_position_targets->pos)::int
    );
    
    IF array_length(v_available_positions, 1) IS NULL THEN
      v_position := v_positions[1 + floor(random() * array_length(v_positions, 1))::int];
    ELSE
      v_position := v_available_positions[1 + floor(random() * array_length(v_available_positions, 1))::int];
    END IF;
    
    SELECT *
    FROM server_players
    WHERE server_id = p_server_id
      AND club_id IS NULL
      AND position = v_position
      AND overall BETWEEN 65 AND 69
      AND id != ALL(v_selected_players)
    ORDER BY random()
    LIMIT 1
    INTO v_player;
    
    v_position_counts := v_position_counts || jsonb_build_object(
      v_position, 
      COALESCE((v_position_counts->v_position)::int, 0) + 1
    );
    
    UPDATE server_players
    SET club_id = p_club_id,
        is_star_player = overall > 85
    WHERE id = v_player.id;
    
    v_selected_players := array_append(v_selected_players, v_player.id);
    RETURN NEXT v_player;
  END LOOP;

  -- Selecionar 4 jogadores titulares (70-74 overall)
  FOR i IN 1..4 LOOP
    v_available_positions := ARRAY(
      SELECT pos
      FROM jsonb_object_keys(v_position_targets) pos
      WHERE (v_position_counts->pos)::int < (v_position_targets->pos)::int
    );
    
    IF array_length(v_available_positions, 1) IS NULL THEN
      v_position := v_positions[1 + floor(random() * array_length(v_positions, 1))::int];
    ELSE
      v_position := v_available_positions[1 + floor(random() * array_length(v_available_positions, 1))::int];
    END IF;
    
    SELECT *
    FROM server_players
    WHERE server_id = p_server_id
      AND club_id IS NULL
      AND position = v_position
      AND overall BETWEEN 70 AND 74
      AND id != ALL(v_selected_players)
    ORDER BY random()
    LIMIT 1
    INTO v_player;
    
    v_position_counts := v_position_counts || jsonb_build_object(
      v_position, 
      COALESCE((v_position_counts->v_position)::int, 0) + 1
    );
    
    UPDATE server_players
    SET club_id = p_club_id,
        is_star_player = overall > 85
    WHERE id = v_player.id;
    
    v_selected_players := array_append(v_selected_players, v_player.id);
    RETURN NEXT v_player;
  END LOOP;

  -- Selecionar 2 jogadores estrela (75-79 overall)
  FOR i IN 1..2 LOOP
    v_available_positions := ARRAY(
      SELECT pos
      FROM jsonb_object_keys(v_position_targets) pos
      WHERE (v_position_counts->pos)::int < (v_position_targets->pos)::int
    );
    
    IF array_length(v_available_positions, 1) IS NULL THEN
      v_position := v_positions[1 + floor(random() * array_length(v_positions, 1))::int];
    ELSE
      v_position := v_available_positions[1 + floor(random() * array_length(v_available_positions, 1))::int];
    END IF;
    
    SELECT *
    FROM server_players
    WHERE server_id = p_server_id
      AND club_id IS NULL
      AND position = v_position
      AND overall BETWEEN 75 AND 79
      AND id != ALL(v_selected_players)
    ORDER BY random()
    LIMIT 1
    INTO v_player;
    
    v_position_counts := v_position_counts || jsonb_build_object(
      v_position, 
      COALESCE((v_position_counts->v_position)::int, 0) + 1
    );
    
    UPDATE server_players
    SET club_id = p_club_id,
        is_star_player = overall > 85
    WHERE id = v_player.id;
    
    v_selected_players := array_append(v_selected_players, v_player.id);
    RETURN NEXT v_player;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para replicar jogadores globais quando um novo servidor é criado
CREATE OR REPLACE FUNCTION replicate_global_players()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO server_players (
    server_id,
    player_base_id,
    name,
    age,
    nationality,
    position,
    overall,
    potential,
    pace,
    shooting,
    passing,
    dribbling,
    defending,
    physical,
    morale,
    form,
    xp,
    level,
    is_star_player
  )
  SELECT
    NEW.id,
    id,
    name,
    age,
    nationality,
    position,
    overall,
    potential,
    pace,
    shooting,
    passing,
    dribbling,
    defending,
    physical,
    50,
    50,
    0,
    1,
    overall > 85
  FROM global_players;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para replicar jogadores quando um novo servidor é criado
CREATE TRIGGER replicate_players_on_server_create
  AFTER INSERT ON servers
  FOR EACH ROW
  EXECUTE FUNCTION replicate_global_players(); 