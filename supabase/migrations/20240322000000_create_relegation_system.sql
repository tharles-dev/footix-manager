-- Criação da tabela de divisões
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id),
    name TEXT NOT NULL,
    level INTEGER NOT NULL, -- 1 = primeira divisão, 2 = segunda divisão, etc
    promotion_spots INTEGER NOT NULL, -- Número de times promovidos
    relegation_spots INTEGER NOT NULL, -- Número de times rebaixados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona coluna division_id na tabela clubs
ALTER TABLE clubs ADD COLUMN division_id UUID REFERENCES divisions(id);

-- Criação da tabela de histórico de rebaixamento/promoção
CREATE TABLE promotion_relegation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id),
    club_id UUID NOT NULL REFERENCES clubs(id),
    season INTEGER NOT NULL,
    from_division_id UUID REFERENCES divisions(id),
    to_division_id UUID REFERENCES divisions(id),
    type TEXT NOT NULL CHECK (type IN ('promotion', 'relegation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para processar rebaixamento/promoção
CREATE OR REPLACE FUNCTION process_promotion_relegation(
    p_server_id UUID,
    p_season INTEGER
) RETURNS VOID AS $$
DECLARE
    v_division RECORD;
    v_club RECORD;
    v_promotion_spots INTEGER;
    v_relegation_spots INTEGER;
    v_target_division RECORD;
BEGIN
    -- Para cada divisão (exceto a última)
    FOR v_division IN 
        SELECT * FROM divisions 
        WHERE server_id = p_server_id 
        AND level < (SELECT MAX(level) FROM divisions WHERE server_id = p_server_id)
        ORDER BY level ASC
    LOOP
        -- Encontra a divisão alvo (próxima divisão)
        SELECT * INTO v_target_division
        FROM divisions
        WHERE server_id = p_server_id
        AND level = v_division.level + 1;

        -- Processa promoções
        v_promotion_spots := v_division.promotion_spots;
        
        FOR v_club IN
            SELECT c.* FROM clubs c
            INNER JOIN competition_clubs cc ON c.id = cc.club_id
            INNER JOIN competitions comp ON cc.competition_id = comp.id
            WHERE c.division_id = v_division.id
            AND comp.server_id = p_server_id
            AND comp.season = p_season
            AND comp.type = 'league'
            ORDER BY cc.points DESC, 
                     (cc.goals_for - cc.goals_against) DESC,
                     cc.goals_for DESC
            LIMIT v_promotion_spots
        LOOP
            -- Atualiza a divisão do clube
            UPDATE clubs 
            SET division_id = v_target_division.id,
                updated_at = NOW()
            WHERE id = v_club.id;

            -- Registra o histórico
            INSERT INTO promotion_relegation_history (
                server_id,
                club_id,
                season,
                from_division_id,
                to_division_id,
                type
            ) VALUES (
                p_server_id,
                v_club.id,
                p_season,
                v_division.id,
                v_target_division.id,
                'promotion'
            );
        END LOOP;

        -- Processa rebaixamentos
        v_relegation_spots := v_division.relegation_spots;
        
        FOR v_club IN
            SELECT c.* FROM clubs c
            INNER JOIN competition_clubs cc ON c.id = cc.club_id
            INNER JOIN competitions comp ON cc.competition_id = comp.id
            WHERE c.division_id = v_division.id
            AND comp.server_id = p_server_id
            AND comp.season = p_season
            AND comp.type = 'league'
            ORDER BY cc.points ASC, 
                     (cc.goals_for - cc.goals_against) ASC,
                     cc.goals_for ASC
            LIMIT v_relegation_spots
        LOOP
            -- Atualiza a divisão do clube
            UPDATE clubs 
            SET division_id = v_target_division.id,
                updated_at = NOW()
            WHERE id = v_club.id;

            -- Registra o histórico
            INSERT INTO promotion_relegation_history (
                server_id,
                club_id,
                season,
                from_division_id,
                to_division_id,
                type
            ) VALUES (
                p_server_id,
                v_club.id,
                p_season,
                v_division.id,
                v_target_division.id,
                'relegation'
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Políticas de segurança
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_relegation_history ENABLE ROW LEVEL SECURITY;

-- Políticas para divisões
CREATE POLICY "Divisões são visíveis para todos os usuários do servidor"
    ON divisions FOR SELECT
    USING (
        server_id IN (
            SELECT server_id FROM server_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Apenas administradores podem criar/editar divisões"
    ON divisions FOR ALL
    USING (
        server_id IN (
            SELECT server_id FROM server_members
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Políticas para histórico de rebaixamento/promoção
CREATE POLICY "Histórico é visível para todos os usuários do servidor"
    ON promotion_relegation_history FOR SELECT
    USING (
        server_id IN (
            SELECT server_id FROM server_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Apenas o sistema pode inserir registros no histórico"
    ON promotion_relegation_history FOR INSERT
    WITH CHECK (false); 