-- Função para forçar a replicação de jogadores para um servidor existente
CREATE OR REPLACE FUNCTION force_replicate_players_to_server(p_server_id UUID)
RETURNS INTEGER AS $$
DECLARE
    player_record RECORD;
    players_count INTEGER := 0;
BEGIN
    -- Verifica se o servidor existe
    IF NOT EXISTS (SELECT 1 FROM servers WHERE id = p_server_id) THEN
        RAISE EXCEPTION 'Servidor com ID % não encontrado', p_server_id;
    END IF;

    -- Para cada jogador na tabela global_players
    FOR player_record IN SELECT * FROM global_players LOOP
        -- Insere o jogador na tabela server_players
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
            contract,
            morale,
            form,
            xp,
            level,
            is_star_player
        ) VALUES (
            p_server_id,
            player_record.id,
            player_record.name,
            player_record.age,
            player_record.nationality,
            player_record.position,
            player_record.overall,
            player_record.potential,
            player_record.pace,
            player_record.shooting,
            player_record.passing,
            player_record.dribbling,
            player_record.defending,
            player_record.physical,
            jsonb_build_object(
                'salary', player_record.base_salary,
                'clause_value', player_record.base_salary * 24,
                'contract_start', NOW(),
                'contract_end', NOW() + INTERVAL '3 years'
            ),
            50, -- morale inicial
            50, -- form inicial
            0,  -- xp inicial
            1,  -- level inicial
            player_record.overall >= 80 -- is_star_player (true se overall >= 80)
        );
        
        players_count := players_count + 1;
    END LOOP;

    RETURN players_count;
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo
COMMENT ON FUNCTION force_replicate_players_to_server IS 'Força a replicação de todos os jogadores da tabela global_players para um servidor existente';

-- Exemplo de uso:
-- SELECT force_replicate_players_to_server('uuid-do-servidor'); 