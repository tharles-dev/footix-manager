-- Adiciona referência para servers
ALTER TABLE club_tactics
ADD COLUMN server_id UUID REFERENCES servers(id) ON DELETE CASCADE;

-- Adiciona campos de estilo de jogo e marcação
ALTER TABLE club_tactics
ADD COLUMN play_style TEXT CHECK (play_style IN ('equilibrado', 'contra-ataque', 'ataque total')),
ADD COLUMN marking TEXT CHECK (marking IN ('leve', 'pesada', 'muito pesada'));

-- Atualiza registros existentes com valores padrão
UPDATE club_tactics
SET play_style = 'equilibrado',
    marking = 'leve'
WHERE play_style IS NULL;

-- Torna os campos obrigatórios
ALTER TABLE club_tactics
ALTER COLUMN play_style SET NOT NULL,
ALTER COLUMN marking SET NOT NULL;

-- Adiciona índices para melhor performance
CREATE INDEX idx_club_tactics_server_id ON club_tactics(server_id); 