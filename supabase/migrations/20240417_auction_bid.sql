-- Função para processar lances em leilões
create or replace function place_auction_bid(
  p_auction_id uuid,
  p_club_id uuid,
  p_amount decimal
) returns void as $$
declare
  v_current_bidder_id uuid;
  v_current_bid decimal;
  v_seller_club_id uuid;
  v_last_bid_id uuid;
begin
  -- Bloquear o leilão para evitar condições de corrida
  select current_bidder_id, current_bid, seller_club_id
  into v_current_bidder_id, v_current_bid, v_seller_club_id
  from auctions
  where id = p_auction_id
  for update;

  -- Verificar se o leilão ainda está ativo
  if not found then
    raise exception 'Leilão não encontrado';
  end if;

  -- Verificar se o leilão está ativo
  if (select status from auctions where id = p_auction_id) != 'active' then
    raise exception 'Este leilão não está ativo';
  end if;

  -- Verificar se o clube não é o vendedor
  if v_seller_club_id = p_club_id then
    raise exception 'Você não pode dar lances em seus próprios leilões';
  end if;

  -- Verificar se o clube não é o atual maior lance
  if v_current_bidder_id = p_club_id then
    raise exception 'Você já é o maior lance';
  end if;

  -- Verificar se o lance é maior que o lance atual
  if p_amount <= v_current_bid then
    raise exception 'O lance deve ser maior que o lance atual';
  end if;

  -- Devolver o saldo do lance anterior (se houver)
  if v_current_bidder_id is not null then
    update clubs
    set balance = balance + v_current_bid
    where id = v_current_bidder_id;
  end if;

  -- Deduzir o saldo do novo lance
  update clubs
  set balance = balance - p_amount
  where id = p_club_id;

  -- Registrar o lance na tabela auction_bids
  insert into auction_bids (auction_id, club_id, bid_amount)
  values (p_auction_id, p_club_id, p_amount)
  returning id into v_last_bid_id;

  -- Atualizar o leilão com o novo lance
  update auctions
  set 
    current_bidder_id = p_club_id,
    current_bid = p_amount,
    updated_at = now()
  where id = p_auction_id;
end;
$$ language plpgsql security definer; 