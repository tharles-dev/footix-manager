-- Adicionar coluna countdown_minutes se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'auctions' AND column_name = 'countdown_minutes') THEN
        ALTER TABLE auctions ADD COLUMN countdown_minutes INTEGER NOT NULL DEFAULT 60;
    END IF;
END $$;

-- Atualizar colunas de agendamento na tabela auctions
ALTER TABLE auctions
ALTER COLUMN is_scheduled SET DEFAULT true;

-- Permitir valores nulos no campo seller_club_id para jogadores livres
ALTER TABLE auctions
ALTER COLUMN seller_club_id DROP NOT NULL;

-- Adicionar comentários explicativos
COMMENT ON COLUMN auctions.is_scheduled IS 'Indica se o leilão está agendado para uma data futura';
COMMENT ON COLUMN auctions.scheduled_start_time IS 'Data e hora programada para início do leilão';
COMMENT ON COLUMN auctions.countdown_minutes IS 'Duração do leilão em minutos após o início';
COMMENT ON COLUMN auctions.seller_club_id IS 'ID do clube vendedor (NULL para jogadores livres)';

-- Garantir que a constraint de status inclua 'scheduled'
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_status_check;
ALTER TABLE auctions ADD CONSTRAINT auctions_status_check 
CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')); 