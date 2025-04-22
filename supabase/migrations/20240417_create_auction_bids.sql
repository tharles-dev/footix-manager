-- Criar tabela de lances em leilões
CREATE TABLE auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    bid_amount DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Garantir que o lance seja maior que o lance anterior
    CONSTRAINT bid_amount_check CHECK (bid_amount > 0)
);

-- Adicionar índices para consultas comuns
CREATE INDEX idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX idx_auction_bids_club_id ON auction_bids(club_id);
CREATE INDEX idx_auction_bids_created_at ON auction_bids(created_at);

-- Adicionar comentários explicativos
COMMENT ON TABLE auction_bids IS 'Registra todos os lances feitos em leilões';
COMMENT ON COLUMN auction_bids.auction_id IS 'ID do leilão';
COMMENT ON COLUMN auction_bids.club_id IS 'ID do clube que fez o lance';
COMMENT ON COLUMN auction_bids.bid_amount IS 'Valor do lance';
COMMENT ON COLUMN auction_bids.created_at IS 'Data e hora do lance'; 