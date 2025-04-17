-- Adiciona a coluna transfer_availability à tabela global_players
ALTER TABLE global_players
ADD COLUMN transfer_availability TEXT NOT NULL DEFAULT 'available' 
CHECK (transfer_availability IN ('available', 'auction_only', 'unavailable'));

-- Comentário explicativo
COMMENT ON COLUMN global_players.transfer_availability IS 'Define a disponibilidade do jogador para transferência: available (disponível para todos os tipos), auction_only (apenas leilão), unavailable (não disponível)';

-- Atualiza a função de replicação para incluir o novo campo
CREATE OR REPLACE FUNCTION replicate_players_to_server()
RETURNS TRIGGER AS $$
DECLARE
    player_record RECORD;
BEGIN
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
            NEW.id, -- ID do novo servidor
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
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 