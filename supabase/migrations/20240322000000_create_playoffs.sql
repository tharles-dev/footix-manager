-- Criar enum para status dos playoffs
CREATE TYPE playoff_status AS ENUM ('pending', 'in_progress', 'completed');

-- Criar tabela de playoffs
CREATE TABLE playoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id),
  season INTEGER NOT NULL,
  status playoff_status NOT NULL DEFAULT 'pending',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  qualified_clubs JSONB NOT NULL, -- Array de clubes qualificados com suas posições
  bracket JSONB, -- Estrutura da chaveamento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, season)
);

-- Criar tabela de partidas dos playoffs
CREATE TABLE playoff_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playoff_id UUID NOT NULL REFERENCES playoffs(id),
  round INTEGER NOT NULL, -- 1: Quartas, 2: Semifinais, 3: Final
  match_number INTEGER NOT NULL, -- Número da partida na rodada
  home_club_id UUID REFERENCES clubs(id),
  away_club_id UUID REFERENCES clubs(id),
  home_goals INTEGER,
  away_goals INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  match_stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playoff_id, round, match_number)
);

-- Função para gerar playoffs automaticamente
CREATE OR REPLACE FUNCTION generate_playoffs(
  p_competition_id UUID,
  p_season INTEGER,
  p_top_teams INTEGER DEFAULT 8
) RETURNS UUID AS $$
DECLARE
  v_playoff_id UUID;
  v_qualified_clubs JSONB;
  v_bracket JSONB;
BEGIN
  -- Buscar clubes qualificados
  SELECT jsonb_agg(
    jsonb_build_object(
      'club_id', cc.club_id,
      'position', ROW_NUMBER() OVER (ORDER BY cc.points DESC, (cc.goals_for - cc.goals_against) DESC)
    )
  )
  INTO v_qualified_clubs
  FROM competition_clubs cc
  WHERE cc.competition_id = p_competition_id
  ORDER BY cc.points DESC, (cc.goals_for - cc.goals_against) DESC
  LIMIT p_top_teams;

  -- Gerar estrutura do bracket
  v_bracket := jsonb_build_object(
    'rounds', jsonb_build_array(
      jsonb_build_object(
        'round', 1,
        'matches', jsonb_build_array(
          jsonb_build_object('match_number', 1),
          jsonb_build_object('match_number', 2),
          jsonb_build_object('match_number', 3),
          jsonb_build_object('match_number', 4)
        )
      ),
      jsonb_build_object(
        'round', 2,
        'matches', jsonb_build_array(
          jsonb_build_object('match_number', 1),
          jsonb_build_object('match_number', 2)
        )
      ),
      jsonb_build_object(
        'round', 3,
        'matches', jsonb_build_array(
          jsonb_build_object('match_number', 1)
        )
      )
    )
  );

  -- Inserir playoffs
  INSERT INTO playoffs (
    competition_id,
    season,
    qualified_clubs,
    bracket
  ) VALUES (
    p_competition_id,
    p_season,
    v_qualified_clubs,
    v_bracket
  ) RETURNING id INTO v_playoff_id;

  -- Gerar partidas iniciais
  INSERT INTO playoff_matches (
    playoff_id,
    round,
    match_number,
    home_club_id,
    away_club_id,
    scheduled_at
  )
  SELECT
    v_playoff_id,
    1,
    m.match_number,
    (v_qualified_clubs->(m.home_position-1)->>'club_id')::UUID,
    (v_qualified_clubs->(m.away_position-1)->>'club_id')::UUID,
    NOW() + (m.match_number || ' days')::INTERVAL
  FROM (
    VALUES
      (1, 1, 8), -- Match 1: 1º vs 8º
      (2, 2, 7), -- Match 2: 2º vs 7º
      (3, 3, 6), -- Match 3: 3º vs 6º
      (4, 4, 5)  -- Match 4: 4º vs 5º
  ) AS m(match_number, home_position, away_position);

  RETURN v_playoff_id;
END;
$$ LANGUAGE plpgsql;

-- Função para processar resultado de partida dos playoffs
CREATE OR REPLACE FUNCTION process_playoff_match(
  p_match_id UUID,
  p_home_goals INTEGER,
  p_away_goals INTEGER,
  p_match_stats JSONB
) RETURNS VOID AS $$
DECLARE
  v_match RECORD;
  v_playoff RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_winner_club_id UUID;
BEGIN
  -- Buscar dados da partida
  SELECT pm.*, p.competition_id, p.season
  INTO v_match
  FROM playoff_matches pm
  JOIN playoffs p ON p.id = pm.playoff_id
  WHERE pm.id = p_match_id;

  -- Verificar se a partida existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partida não encontrada';
  END IF;

  -- Verificar se a partida já está concluída
  IF v_match.status = 'completed' THEN
    RAISE EXCEPTION 'Partida já está concluída';
  END IF;

  -- Determinar vencedor
  IF p_home_goals > p_away_goals THEN
    v_winner_club_id := v_match.home_club_id;
  ELSIF p_home_goals < p_away_goals THEN
    v_winner_club_id := v_match.away_club_id;
  ELSE
    -- Em caso de empate, time da casa avança
    v_winner_club_id := v_match.home_club_id;
  END IF;

  -- Atualizar partida
  UPDATE playoff_matches
  SET 
    status = 'completed',
    home_goals = p_home_goals,
    away_goals = p_away_goals,
    match_stats = p_match_stats,
    updated_at = NOW()
  WHERE id = p_match_id;

  -- Se não for a final, criar próxima partida
  IF v_match.round < 3 THEN
    v_next_round := v_match.round + 1;
    v_next_match_number := CEIL(v_match.match_number::FLOAT / 2);

    -- Verificar se a próxima partida já existe
    IF NOT EXISTS (
      SELECT 1 FROM playoff_matches
      WHERE playoff_id = v_match.playoff_id
      AND round = v_next_round
      AND match_number = v_next_match_number
    ) THEN
      -- Criar próxima partida
      INSERT INTO playoff_matches (
        playoff_id,
        round,
        match_number,
        scheduled_at
      ) VALUES (
        v_match.playoff_id,
        v_next_round,
        v_next_match_number,
        NOW() + (v_next_match_number || ' days')::INTERVAL
      );
    END IF;

    -- Atualizar próximo jogo com o vencedor
    IF v_match.match_number % 2 = 1 THEN
      UPDATE playoff_matches
      SET home_club_id = v_winner_club_id
      WHERE playoff_id = v_match.playoff_id
      AND round = v_next_round
      AND match_number = v_next_match_number;
    ELSE
      UPDATE playoff_matches
      SET away_club_id = v_winner_club_id
      WHERE playoff_id = v_match.playoff_id
      AND round = v_next_round
      AND match_number = v_next_match_number;
    END IF;
  ELSE
    -- Se for a final, atualizar status dos playoffs
    UPDATE playoffs
    SET 
      status = 'completed',
      end_date = NOW()
    WHERE id = v_match.playoff_id;
  END IF;

  -- Registrar log
  INSERT INTO admin_logs (
    server_id,
    type,
    message,
    metadata
  ) VALUES (
    (SELECT server_id FROM competitions WHERE id = v_match.competition_id),
    'playoff_match',
    'Resultado dos playoffs: ' || p_home_goals || ' x ' || p_away_goals,
    jsonb_build_object(
      'match_id', p_match_id,
      'playoff_id', v_match.playoff_id,
      'round', v_match.round,
      'winner_id', v_winner_club_id
    )
  );
END;
$$ LANGUAGE plpgsql; 