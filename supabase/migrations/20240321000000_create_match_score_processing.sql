-- Função para processar a pontuação de uma partida
CREATE OR REPLACE FUNCTION process_match_score(
  p_match_id UUID,
  p_home_goals INTEGER,
  p_away_goals INTEGER,
  p_match_stats JSONB
) RETURNS VOID AS $$
DECLARE
  v_match RECORD;
  v_competition RECORD;
  v_home_points INTEGER;
  v_away_points INTEGER;
BEGIN
  -- Buscar dados da partida
  SELECT m.*, c.points_win, c.points_draw
  INTO v_match, v_competition
  FROM matches m
  JOIN competitions c ON c.id = m.competition_id
  WHERE m.id = p_match_id;

  -- Verificar se a partida existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partida não encontrada';
  END IF;

  -- Verificar se a partida já está concluída
  IF v_match.status = 'completed' THEN
    RAISE EXCEPTION 'Partida já está concluída';
  END IF;

  -- Calcular pontos
  IF p_home_goals > p_away_goals THEN
    v_home_points := v_competition.points_win;
    v_away_points := 0;
  ELSIF p_home_goals < p_away_goals THEN
    v_home_points := 0;
    v_away_points := v_competition.points_win;
  ELSE
    v_home_points := v_competition.points_draw;
    v_away_points := v_competition.points_draw;
  END IF;

  -- Atualizar partida
  UPDATE matches
  SET 
    status = 'completed',
    home_goals = p_home_goals,
    away_goals = p_away_goals,
    match_stats = p_match_stats,
    updated_at = NOW()
  WHERE id = p_match_id;

  -- Atualizar classificação do time da casa
  UPDATE competition_clubs
  SET 
    points = points + v_home_points,
    goals_for = goals_for + p_home_goals,
    goals_against = goals_against + p_away_goals,
    wins = CASE WHEN p_home_goals > p_away_goals THEN wins + 1 ELSE wins END,
    draws = CASE WHEN p_home_goals = p_away_goals THEN draws + 1 ELSE draws END,
    losses = CASE WHEN p_home_goals < p_away_goals THEN losses + 1 ELSE losses END
  WHERE competition_id = v_match.competition_id
  AND club_id = v_match.home_club_id;

  -- Atualizar classificação do time visitante
  UPDATE competition_clubs
  SET 
    points = points + v_away_points,
    goals_for = goals_for + p_away_goals,
    goals_against = goals_against + p_home_goals,
    wins = CASE WHEN p_away_goals > p_home_goals THEN wins + 1 ELSE wins END,
    draws = CASE WHEN p_away_goals = p_home_goals THEN draws + 1 ELSE draws END,
    losses = CASE WHEN p_away_goals < p_home_goals THEN losses + 1 ELSE losses END
  WHERE competition_id = v_match.competition_id
  AND club_id = v_match.away_club_id;

  -- Registrar log
  INSERT INTO admin_logs (
    server_id,
    type,
    message,
    metadata
  ) VALUES (
    v_match.server_id,
    'match_score',
    'Pontuação registrada: ' || p_home_goals || ' x ' || p_away_goals,
    jsonb_build_object(
      'match_id', p_match_id,
      'home_goals', p_home_goals,
      'away_goals', p_away_goals,
      'home_points', v_home_points,
      'away_points', v_away_points
    )
  );
END;
$$ LANGUAGE plpgsql; 