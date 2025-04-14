-- Remover a coluna attributes das tabelas de jogadores

-- Remover a coluna attributes da tabela global_players
ALTER TABLE global_players DROP COLUMN attributes;

-- Remover a coluna attributes da tabela server_players
ALTER TABLE server_players DROP COLUMN attributes; 