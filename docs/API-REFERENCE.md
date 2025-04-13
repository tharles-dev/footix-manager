# 📡 FOOTIX - API REFERENCE

## 👤 Auth & Users

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
- Retorna jogadores iniciais, saldo e status

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

- Atualiza formação e escalação de titulares/reservas

### GET `/api/players/available`

- Lista jogadores sem clube disponíveis para contratação

---

## 🗓️ Temporada e Partidas

### GET `/api/season/status`

- Retorna status da temporada (rodada atual, simulação ativa, data da próxima rodada)

### GET `/api/matches/upcoming`

- Retorna próximos jogos do clube logado

### GET `/api/matches/{id}`

- Detalhes do jogo: escalação, gols, estatísticas, rodada

---

## 💰 Finanças & Transferências

### GET `/api/finance/{club_id}`

- Detalha finanças do clube: saldo, teto salarial, gastos, multas previstas

### POST `/api/transfer/request`

- Envia proposta de compra para outro clube

### POST `/api/transfer/accept`

- Aceita proposta recebida e transfere jogador

### POST `/api/transfer/pay-clause`

- Compra jogador direto pagando cláusula de rescisão

### POST `/api/transfer/free-agent`

- Contrata jogador sem clube

### POST `/api/transfer/auction`

- Inicia leilão por jogador
- Payload:

```json
{
  "player_id": "uuid",
  "starting_bid": 500000,
  "duration_hours": 24
}
```

---

## 🏆 Competições

### GET `/api/competitions/{server_id}`

- Lista todas as competições ativas do servidor

### GET `/api/competitions/{id}/standings`

- Tabela de classificação atual da competição

### GET `/api/competitions/{id}/rewards`

- Premiações por posição, artilheiro, assistências, etc

---

## 📊 Estatísticas

### GET `/api/player/{id}/stats`

- Estatísticas por temporada de um jogador

### GET `/api/club/{id}/history`

- Histórico de desempenho e financeiro do clube

---

## 📈 Painel Admin

### GET `/api/admin/servers`

- Lista todos os servidores com status atual

### GET `/api/admin/logs/{server_id}`

- Logs do servidor: simulações, negociações, punições, etc
