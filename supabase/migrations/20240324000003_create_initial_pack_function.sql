-- Função para gerar o pack inicial de jogadores para um clube
CREATE OR REPLACE FUNCTION generate_initial_player_pack(p_club_id UUID, p_server_id UUID)
RETURNS SETOF server_players AS $$
DECLARE
    v_player RECORD;
    v_players_count INTEGER;
    v_low_players INTEGER := 6;
    v_medium_players INTEGER := 6;
    v_starting_players INTEGER := 4;
    v_star_players INTEGER := 2;
    v_total_players INTEGER := v_low_players + v_medium_players + v_starting_players + v_star_players;
    v_selected_players UUID[] := '{}';
BEGIN
    -- Verifica se o clube existe
    IF NOT EXISTS (SELECT 1 FROM clubs WHERE id = p_club_id) THEN
        RAISE EXCEPTION 'Clube com ID % não encontrado', p_club_id;
    END IF;
    
    -- Verifica se o servidor existe
    IF NOT EXISTS (SELECT 1 FROM servers WHERE id = p_server_id) THEN
        RAISE EXCEPTION 'Servidor com ID % não encontrado', p_server_id;
    END IF;
    
    -- Verifica se o clube pertence ao servidor
    IF NOT EXISTS (SELECT 1 FROM clubs WHERE id = p_club_id AND server_id = p_server_id) THEN
        RAISE EXCEPTION 'Clube com ID % não pertence ao servidor %', p_club_id, p_server_id;
    END IF;
    
    -- Verifica se o clube já tem jogadores
    SELECT COUNT(*) INTO v_players_count FROM server_players WHERE club_id = p_club_id;
    IF v_players_count > 0 THEN
        RAISE EXCEPTION 'O clube já possui jogadores. O pack inicial só pode ser gerado uma vez.';
    END IF;
    
    -- Verifica se existem jogadores disponíveis no servidor
    SELECT COUNT(*) INTO v_players_count FROM server_players WHERE server_id = p_server_id AND club_id IS NULL;
    IF v_players_count < v_total_players THEN
        RAISE EXCEPTION 'Não há jogadores suficientes disponíveis no servidor. Necessário: %, Disponíveis: %', v_total_players, v_players_count;
    END IF;
    
    -- Seleciona jogadores de baixo overall (60-64)
    FOR v_player IN 
        SELECT * FROM server_players 
        WHERE server_id = p_server_id 
        AND club_id IS NULL 
        AND overall BETWEEN 60 AND 64
        AND id != ALL(v_selected_players)
        ORDER BY RANDOM() 
        LIMIT v_low_players
    LOOP
        -- Atualiza o jogador para o clube
        UPDATE server_players 
        SET club_id = p_club_id,
            contract = jsonb_build_object(
                'salary', 12000,
                'clause_value', 12000 * 24,
                'contract_start', NOW(),
                'contract_end', NOW() + INTERVAL '3 years'
            )
        WHERE id = v_player.id;
        
        v_selected_players := array_append(v_selected_players, v_player.id);
    END LOOP;
    
    -- Seleciona jogadores de médio overall (65-69)
    FOR v_player IN 
        SELECT * FROM server_players 
        WHERE server_id = p_server_id 
        AND club_id IS NULL 
        AND overall BETWEEN 65 AND 69
        AND id != ALL(v_selected_players)
        ORDER BY RANDOM() 
        LIMIT v_medium_players
    LOOP
        -- Atualiza o jogador para o clube
        UPDATE server_players 
        SET club_id = p_club_id,
            contract = jsonb_build_object(
                'salary', 22000,
                'clause_value', 22000 * 24,
                'contract_start', NOW(),
                'contract_end', NOW() + INTERVAL '3 years'
            )
        WHERE id = v_player.id;
        
        v_selected_players := array_append(v_selected_players, v_player.id);
    END LOOP;
    
    -- Seleciona jogadores titulares (70-74)
    FOR v_player IN 
        SELECT * FROM server_players 
        WHERE server_id = p_server_id 
        AND club_id IS NULL 
        AND overall BETWEEN 70 AND 74
        AND id != ALL(v_selected_players)
        ORDER BY RANDOM() 
        LIMIT v_starting_players
    LOOP
        -- Atualiza o jogador para o clube
        UPDATE server_players 
        SET club_id = p_club_id,
            contract = jsonb_build_object(
                'salary', 35000,
                'clause_value', 35000 * 24,
                'contract_start', NOW(),
                'contract_end', NOW() + INTERVAL '3 years'
            )
        WHERE id = v_player.id;
        
        v_selected_players := array_append(v_selected_players, v_player.id);
    END LOOP;
    
    -- Seleciona jogadores estrela (75-79)
    FOR v_player IN 
        SELECT * FROM server_players 
        WHERE server_id = p_server_id 
        AND club_id IS NULL 
        AND overall BETWEEN 75 AND 79
        AND id != ALL(v_selected_players)
        ORDER BY RANDOM() 
        LIMIT v_star_players
    LOOP
        -- Atualiza o jogador para o clube
        UPDATE server_players 
        SET club_id = p_club_id,
            contract = jsonb_build_object(
                'salary', 48000,
                'clause_value', 48000 * 24,
                'contract_start', NOW(),
                'contract_end', NOW() + INTERVAL '3 years'
            )
        WHERE id = v_player.id;
        
        v_selected_players := array_append(v_selected_players, v_player.id);
    END LOOP;
    
    -- Retorna os jogadores selecionados
    RETURN QUERY
    SELECT * FROM server_players WHERE id = ANY(v_selected_players);
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo
COMMENT ON FUNCTION generate_initial_player_pack IS 'Gera o pack inicial de jogadores para um clube, selecionando jogadores aleatórios da tabela server_players que ainda não estão vinculados a nenhum clube';

-- Exemplo de uso:
-- SELECT * FROM generate_initial_player_pack('uuid-do-clube', 'uuid-do-servidor'); 