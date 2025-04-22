# 📡 FOOTIX - API REFERENCE (Atualizada)

## 👤 Auth & Users

### POST `/api/auth/google`

- Login com Google via Supabase Auth
- Redireciona automaticamente para a página apropriada (admin ou web) após autenticação bem-sucedida
- O fluxo de autenticação é gerenciado pelo Supabase Auth

**Fluxo:**

1. Cliente chama o endpoint
2. Supabase redireciona para tela de login do Google
3. Após login bem-sucedido, redireciona automaticamente para:
   - `/admin` se o usuário tem role "admin"
   - `/web` se o usuário tem role "user"

**Resposta de Sucesso (200):**

```json
{
  "data": {
    "authenticated": true,
    "user": {
      "id": "uuid",
      "email": "string",
      "role": "string"
    }
  }
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Falha na autenticação com Google
- `SERVER_ERROR`: Erro interno do servidor

### POST `/api/auth/login`

- Login com token do Supabase
- Retorna dados do usuário e do clube (se existir)

### GET `/api/user/me`

- Retorna perfil do usuário logado + clube (se vinculado)

---

## 🏠 Servidor & Clube

### POST `/api/server/assign`

- Atribui jogador a um servidor com vaga
- Se nenhum disponível, cria novo servidor com base na base global

### POST `/api/club/create`

- Cria clube do jogador no servidor
- Payload:

```json
{
  "name": "Nome do Clube",
  "city": "Cidade",
  "country": "País",
  "logo_url": "https://exemplo.com/logo.png",
  "server_id": "uuid-do-servidor"
}
```

- Valores iniciais:
  - Saldo: 5.000.000
  - Reputação: 50
  - Torcida: 1.000
  - Estádio: 10.000 lugares
  - Ingresso: 20
  - Sócios: 100
- Validações:
  - Nome: 3-50 caracteres
  - Cidade/País: 2-50 caracteres
  - Logo: URL válida (opcional)
  - Servidor: UUID válido e com vagas
- Rate Limit: 5 requisições/minuto
- Cache: 5 minutos

### GET `/api/club/{id}`

- Detalhes completos do clube (tática, elenco, saldo, divisão)

### GET `/api/server/{id}/config`

- Retorna as configurações completas do servidor (budget, regras, simulação, etc)

---

## 📋 Configurações do Servidor (Admin)

### POST `/api/admin/server/manual`

- Cria servidor manualmente
- Payload:

```json
{
  "name": "Servidor 01",
  "max_members": 64,
  "initial_budget": 5000000,
  "budget_growth_per_season": 0.1,
  "salary_cap": 3500000,
  "salary_cap_penalty_percentage": 0.1,
  "min_player_salary_percentage": 80,
  "max_player_salary_percentage": 150,
  "activate_clause": true,
  "auto_clause_percentage": 200,
  "market_value_multiplier": 24,
  "enable_monetization": false,
  "match_frequency_minutes": 1440,
  "enable_auto_simulation": true
}
```

### POST `/api/admin/season/close`

- Finaliza temporada, aplica prêmios, rebaixa/promove, gera nova

---

## 🧠 Táticas & Elenco

### POST `/api/club/{id}/tactics`

- Atualiza formação e escalação do clube
- Payload:

```json
{
  "formation": "4-4-2",
  "starting_ids": ["uuid1", "uuid2", ...], // 11 jogadores
  "bench_ids": ["uuid1", "uuid2", ...], // 5-7 jogadores
  "captain_id": "uuid", // deve estar entre titulares
  "free_kick_taker_id": "uuid", // opcional, deve estar entre jogadores selecionados
  "penalty_taker_id": "uuid", // opcional, deve estar entre jogadores selecionados
  "play_style": "equilibrado", // estilo de jogo do time
  "marking": "leve" // estilo de marcação do time
}
```

- Validações:
  - Formação: formato válido (ex: 4-4-2, 3-5-2)
  - Titulares: exatamente 11 jogadores
  - Reservas: 5-7 jogadores
  - Capitão: deve estar entre titulares
  - Cobrador de falta: deve estar entre jogadores selecionados (opcional)
  - Cobrador de pênalti: deve estar entre jogadores selecionados (opcional)
  - Estilo de jogo: deve ser um dos valores válidos ("equilibrado", "contra-ataque", "ataque total")
  - Marcação: deve ser um dos valores válidos ("leve", "pesada", "muito pesada")
  - Todos os jogadores devem pertencer ao clube
- Rate Limit: 10 requisições/minuto (PUT), 30 requisições/minuto (GET)
- Cache: 5 minutos (GET)

### GET `/api/club/{id}/tactics`

- Retorna formação e escalação atual do clube
- Inclui dados completos dos jogadores:
  - Titulares
  - Reservas
  - Capitão
  - Cobrador de falta (se definido)
  - Cobrador de pênalti (se definido)
  - Estilo de jogo
  - Marcação
- Campos dos jogadores:
  - id, name, position
  - attributes (força, velocidade, etc)

### GET `/api/players/available`

- Lista jogadores sem clube disponíveis para contratação
- Query params:
  - `position`: Filtra por posição
  - `min_age`: Idade mínima
  - `max_age`: Idade máxima
  - `min_value`: Valor mínimo
  - `max_value`: Valor máximo
  - `page`: Página (default: 1)
  - `limit`: Itens por página (default: 20)
- Retorna:
  - Lista de jogadores com dados básicos
  - Informações de paginação
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

---

## 💰 Transferências

### POST `/api/transfer/hire`

- Contrata um jogador sem clube
- Payload:

```json
{
  "player_id": "uuid",
  "salary": 100000,
  "contract_years": 3
}
```

- Validações:
  - Jogador deve estar disponível
  - Salário deve estar dentro dos limites do servidor
  - Clube deve ter saldo suficiente
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Contrato do jogador
  - Saldo do clube
  - Cache do clube e jogador

### POST `/api/transfer/sell`

- Vende um jogador para outro clube
- Payload:

```json
{
  "player_id": "uuid",
  "price": 1000000,
  "buyer_club_id": "uuid"
}
```

- Validações:
  - Jogador deve pertencer ao clube vendedor
  - Clube comprador deve existir
  - Clube comprador deve ter saldo suficiente
  - Jogador não pode estar emprestado
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Contrato do jogador
  - Saldo dos clubes (vendedor e comprador)
  - Cache dos clubes e jogador

---

## 🏆 Competições

### GET `/api/competitions/{server_id}`

- Lista todas as competições ativas do servidor

### GET `/api/competitions/{id}/standings`

- Tabela de classificação atual da competição

### GET `/api/competitions/{id}/rewards`

- Premiações por posição, artilheiro, assistências, etc

---

## 📊 Admin

### GET `/api/admin/servers`

- Lista todos os servidores com status atual

### GET `/api/admin/players/global`

- Lista todos os jogadores globais disponíveis para importação
- Query params:
  - `page`: Página (default: 1)
  - `limit`: Itens por página (default: 20)
  - `position`: Filtra por posição (GK, DEF, MID, ATT)
  - `search`: Busca por nome
  - `min_overall`: Overall mínimo
  - `max_overall`: Overall máximo
  - `min_potential`: Potencial mínimo
  - `max_potential`: Potencial máximo
- Retorna:
  ```json
  {
    "data": {
      "players": [
        {
          "id": "uuid",
          "name": "string",
          "age": "number",
          "nationality": "string",
          "position": "string",
          "overall": "number",
          "potential": "number",
          "pace": "number",
          "shooting": "number",
          "passing": "number",
          "dribbling": "number",
          "defending": "number",
          "physical": "number",
          "base_salary": "number",
          "base_value": "number"
        }
      ],
      "pagination": {
        "total": "number",
        "page": "number",
        "limit": "number",
        "pages": "number"
      }
    }
  }
  ```
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### GET `/api/admin/players/server/{server_id}`

- Lista todos os jogadores de um servidor específico
- Query params:
  - `page`: Página (default: 1)
  - `limit`: Itens por página (default: 20)
  - `position`: Filtra por posição (GK, DEF, MID, ATT)
  - `search`: Busca por nome
  - `club_id`: Filtra por clube
  - `is_on_loan`: Filtra por jogadores emprestados (true/false)
  - `is_star_player`: Filtra por jogadores estrela (true/false)
- Retorna:
  ```json
  {
    "data": {
      "players": [
        {
          "id": "uuid",
          "name": "string",
          "age": "number",
          "nationality": "string",
          "position": "string",
          "overall": "number",
          "potential": "number",
          "pace": "number",
          "shooting": "number",
          "passing": "number",
          "dribbling": "number",
          "defending": "number",
          "physical": "number",
          "contract": {
            "salary": "number",
            "clause_value": "number",
            "contract_start": "timestamp",
            "contract_end": "timestamp"
          },
          "club_id": "uuid",
          "club_name": "string",
          "is_on_loan": "boolean",
          "loan_from_club_id": "uuid",
          "loan_from_club_name": "string",
          "morale": "number",
          "form": "number",
          "xp": "number",
          "level": "number",
          "is_star_player": "boolean"
        }
      ],
      "pagination": {
        "total": "number",
        "page": "number",
        "limit": "number",
        "pages": "number"
      }
    }
  }
  ```
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos
