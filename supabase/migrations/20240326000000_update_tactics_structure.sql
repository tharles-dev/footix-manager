-- Atualiza a estrutura da tabela club_tactics para armazenar as posições dos jogadores
ALTER TABLE club_tactics
ALTER COLUMN starting_ids TYPE TEXT[],
ALTER COLUMN bench_ids TYPE TEXT[];

-- Adiciona comentários aos campos
COMMENT ON COLUMN club_tactics.starting_ids IS 'Array de strings no formato "UUID:POSITION-INDEX"';
COMMENT ON COLUMN club_tactics.bench_ids IS 'Array de strings no formato "UUID:BENCH-INDEX"';

-- Adiciona trigger para validar o formato dos IDs
CREATE OR REPLACE FUNCTION validate_tactics_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Valida starting_ids
  IF NEW.starting_ids IS NOT NULL THEN
    FOR i IN 1..array_length(NEW.starting_ids, 1) LOOP
      IF NEW.starting_ids[i] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[A-Z]+-\d+$' THEN
        RAISE EXCEPTION 'Formato inválido para starting_ids[%]: %', i, NEW.starting_ids[i];
      END IF;
    END LOOP;
  END IF;

  -- Valida bench_ids
  IF NEW.bench_ids IS NOT NULL THEN
    FOR i IN 1..array_length(NEW.bench_ids, 1) LOOP
      IF NEW.bench_ids[i] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:BENCH-\d+$' THEN
        RAISE EXCEPTION 'Formato inválido para bench_ids[%]: %', i, NEW.bench_ids[i];
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_tactics_ids_trigger
BEFORE INSERT OR UPDATE ON club_tactics
FOR EACH ROW
EXECUTE FUNCTION validate_tactics_ids(); 