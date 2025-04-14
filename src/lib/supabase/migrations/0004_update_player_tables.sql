-- Atualização das tabelas de jogadores para suportar os novos campos

-- Primeiro, vamos adicionar os novos campos à tabela global_players
ALTER TABLE global_players
ADD COLUMN overall INTEGER NOT NULL DEFAULT 70,
ADD COLUMN potential INTEGER NOT NULL DEFAULT 70,
ADD COLUMN pace INTEGER NOT NULL DEFAULT 70,
ADD COLUMN shooting INTEGER NOT NULL DEFAULT 70,
ADD COLUMN passing INTEGER NOT NULL DEFAULT 70,
ADD COLUMN dribbling INTEGER NOT NULL DEFAULT 70,
ADD COLUMN defending INTEGER NOT NULL DEFAULT 70,
ADD COLUMN physical INTEGER NOT NULL DEFAULT 70;

-- Agora, vamos adicionar os novos campos à tabela server_players
ALTER TABLE server_players
ADD COLUMN overall INTEGER NOT NULL DEFAULT 70,
ADD COLUMN potential INTEGER NOT NULL DEFAULT 70,
ADD COLUMN pace INTEGER NOT NULL DEFAULT 70,
ADD COLUMN shooting INTEGER NOT NULL DEFAULT 70,
ADD COLUMN passing INTEGER NOT NULL DEFAULT 70,
ADD COLUMN dribbling INTEGER NOT NULL DEFAULT 70,
ADD COLUMN defending INTEGER NOT NULL DEFAULT 70,
ADD COLUMN physical INTEGER NOT NULL DEFAULT 70;

-- Criar uma função para migrar dados existentes
CREATE OR REPLACE FUNCTION migrate_player_attributes()
RETURNS void AS $$
DECLARE
    player RECORD;
BEGIN
    -- Migrar dados da tabela global_players
    FOR player IN SELECT id, attributes FROM global_players LOOP
        UPDATE global_players
        SET 
            overall = COALESCE((attributes->>'overall')::INTEGER, 70),
            potential = COALESCE((attributes->>'potential')::INTEGER, 70),
            pace = COALESCE((attributes->>'pace')::INTEGER, 70),
            shooting = COALESCE((attributes->>'shooting')::INTEGER, 70),
            passing = COALESCE((attributes->>'passing')::INTEGER, 70),
            dribbling = COALESCE((attributes->>'dribbling')::INTEGER, 70),
            defending = COALESCE((attributes->>'defending')::INTEGER, 70),
            physical = COALESCE((attributes->>'physical')::INTEGER, 70)
        WHERE id = player.id;
    END LOOP;

    -- Migrar dados da tabela server_players
    FOR player IN SELECT id, attributes FROM server_players LOOP
        UPDATE server_players
        SET 
            overall = COALESCE((attributes->>'overall')::INTEGER, 70),
            potential = COALESCE((attributes->>'potential')::INTEGER, 70),
            pace = COALESCE((attributes->>'pace')::INTEGER, 70),
            shooting = COALESCE((attributes->>'shooting')::INTEGER, 70),
            passing = COALESCE((attributes->>'passing')::INTEGER, 70),
            dribbling = COALESCE((attributes->>'dribbling')::INTEGER, 70),
            defending = COALESCE((attributes->>'defending')::INTEGER, 70),
            physical = COALESCE((attributes->>'physical')::INTEGER, 70)
        WHERE id = player.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função de migração
SELECT migrate_player_attributes();

-- Remover a função após a migração
DROP FUNCTION migrate_player_attributes();

-- Adicionar políticas RLS para os novos campos
CREATE POLICY "Apenas administradores podem gerenciar global_players"
ON global_players FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = auth.uid() AND sm.role = 'admin'
  )
);

CREATE POLICY "Apenas administradores podem gerenciar server_players"
ON server_players FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = auth.uid() AND sm.role = 'admin'
  )
); 