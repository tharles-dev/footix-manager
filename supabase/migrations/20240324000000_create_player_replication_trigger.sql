-- Criação da função para replicar jogadores
CREATE OR REPLACE FUNCTION replicate_players_to_server()
RETURNS TRIGGER AS $$
DECLARE
    player_record RECORD;
BEGIN
    -- Para cada jogador na tabela global_players
    FOR player_record IN SELECT * FROM global_players LOOP
        -- Insere o jogador na tabela server_players
        INSERT INTO server_players (
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
                'contract_end', NOW() + INTERVAL '1 year'
            ),
            50, -- morale inicial
            50, -- form inicial
            0,  -- xp inicial
            1,  -- level inicial
            player_record.overall >= 86 -- is_star_player (true se overall >= 80)
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criação da trigger
CREATE TRIGGER replicate_players_after_server_creation
AFTER INSERT ON servers
FOR EACH ROW
EXECUTE FUNCTION replicate_players_to_server();

-- Comentário explicativo
COMMENT ON FUNCTION replicate_players_to_server() IS 'Replica todos os jogadores da tabela global_players para server_players quando um novo servidor é criado';
COMMENT ON TRIGGER replicate_players_after_server_creation ON servers IS 'Dispara a replicação de jogadores após a criação de um novo servidor'; 