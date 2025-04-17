-- Adicionar campos de agendamento à tabela auctions
ALTER TABLE auctions
ADD COLUMN scheduled_start_time TIMESTAMP,
ADD COLUMN scheduled_end_time TIMESTAMP,
ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN auctions.scheduled_start_time IS 'Data e hora programada para início do leilão';
COMMENT ON COLUMN auctions.scheduled_end_time IS 'Data e hora programada para término do leilão';
COMMENT ON COLUMN auctions.is_scheduled IS 'Indica se o leilão está agendado para uma data futura';

-- Atualizar a constraint de status para incluir 'scheduled'
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_status_check;
ALTER TABLE auctions ADD CONSTRAINT auctions_status_check 
CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')); 