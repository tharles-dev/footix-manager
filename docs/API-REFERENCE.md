# 📡 FOOTIX - API REFERENCE

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
  "penalty_taker_id": "uuid" // opcional, deve estar entre jogadores selecionados
}
```

- Validações:
  - Formação: formato válido (ex: 4-4-2, 3-5-2)
  - Titulares: exatamente 11 jogadores
  - Reservas: 5-7 jogadores
  - Capitão: deve estar entre titulares
  - Cobrador de falta: deve estar entre jogadores selecionados (opcional)
  - Cobrador de pênalti: deve estar entre jogadores selecionados (opcional)
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

### GET `/api/club/{id}/finance/budget`

- Retorna informações detalhadas do orçamento do clube
- Inclui:
  - Orçamento base e bônus
  - Despesas totais e por categoria
  - Receitas totais e por categoria
  - Projeções de receita com ingressos
  - Saldo atual
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### PUT `/api/club/{id}/finance/budget`

- Atualiza configurações do orçamento do clube
- Payload:
  ```json
  {
    "season_budget_base": 5000000,
    "season_budget_bonus": 1000000,
    "ticket_price": 50,
    "season_ticket_price": 200
  }
  ```
- Rate Limit: 5 requisições/minuto

### GET `/api/club/{id}/finance/budget/expenses`

- Lista todas as despesas da temporada atual
- Retorna:
  ```json
  {
    "data": {
      "expenses": [
        {
          "id": "uuid",
          "amount": 100000,
          "description": "Manutenção do estádio",
          "category": "facilities",
          "created_at": "2024-03-20T10:00:00Z"
        }
      ]
    }
  }
  ```
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### POST `/api/club/{id}/finance/budget/expenses`

- Registra uma nova despesa
- Payload:
  ```json
  {
    "amount": 100000,
    "description": "Manutenção do estádio",
    "category": "facilities"
  }
  ```
- Validações:
  - Valor mínimo: 1.000
  - Descrição: 3-200 caracteres
  - Categoria: salary, facilities, marketing, other
  - Clube deve ter saldo suficiente
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Saldo do clube
  - Cache do clube

### GET `/api/club/{id}/finance/budget/revenues`

- Lista todas as receitas da temporada atual
- Retorna:
  ```json
  {
    "data": {
      "revenues": [
        {
          "id": "uuid",
          "amount": 50000,
          "description": "Venda de ingressos",
          "category": "ticket_sales",
          "created_at": "2024-03-20T10:00:00Z"
        }
      ]
    }
  }
  ```
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### POST `/api/club/{id}/finance/budget/revenues`

- Registra uma nova receita
- Payload:
  ```json
  {
    "amount": 50000,
    "description": "Venda de ingressos",
    "category": "ticket_sales"
  }
  ```
- Validações:
  - Valor deve ser positivo
  - Descrição: 3-255 caracteres
  - Categoria: ticket_sales, merchandise, sponsorship, other
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Saldo do clube
  - Cache do clube

### GET `/api/club/{id}/finance/penalty`

- Lista todas as multas do clube
- Retorna:
  ```json
  {
    "data": {
      "penalties": [
        {
          "id": "uuid",
          "type": "red_card | salary_cap | other",
          "amount": 100000,
          "status": "pending | paid | waived",
          "description": "Descrição da multa",
          "created_at": "2024-03-20T10:00:00Z",
          "match_id": "uuid", // opcional
          "player_id": "uuid" // opcional
        }
      ]
    }
  }
  ```
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### POST `/api/club/{id}/finance/penalty/pay`

- Processa o pagamento de uma multa
- Payload:
  ```json
  {
    "penalty_id": "uuid"
  }
  ```
- Retorna:
  ```json
  {
    "message": "Multa paga com sucesso",
    "data": {
      "penalty_id": "uuid",
      "amount": 100000,
      "new_balance": 900000
    }
  }
  ```
- Validações:
  - Multa deve existir e estar pendente
  - Clube deve ter saldo suficiente
  - Clube deve ser o dono da multa
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Status da multa para "paid"
  - Saldo do clube
  - Cache do clube

### GET `/api/club/{id}/finance/loan`

- Lista todos os empréstimos ativos do clube
- Retorna:
  ```json
  {
    "data": {
      "loans": [
        {
          "id": "uuid",
          "amount": 1000000,
          "interest_rate": 0.1,
          "total_amount": 1100000,
          "monthly_payment": 91666.67,
          "duration_months": 12,
          "remaining_months": 10,
          "status": "active",
          "created_at": "2024-03-20T10:00:00Z"
        }
      ]
    }
  }
  ```
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### POST `/api/club/{id}/finance/loan`

- Solicita um novo empréstimo
- Payload:
  ```json
  {
    "amount": 1000000,
    "duration_months": 12
  }
  ```
- Retorna:
  ```json
  {
    "message": "Empréstimo solicitado com sucesso",
    "data": {
      "loan_id": "uuid",
      "amount": 1000000,
      "interest_rate": 0.1,
      "total_amount": 1100000,
      "monthly_payment": 91666.67,
      "duration_months": 12
    }
  }
  ```
- Validações:
  - Valor mínimo: 100.000
  - Valor máximo: 10.000.000
  - Duração mínima: 3 meses
  - Duração máxima: 12 meses
  - Clube não pode ter empréstimos ativos
  - Taxa de juros baseada na reputação do clube
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Saldo do clube
  - Cache do clube

### POST `/api/club/{id}/finance/loan/pay`

- Paga uma parcela do empréstimo
- Payload:
  ```json
  {
    "loan_id": "uuid"
  }
  ```
- Retorna:
  ```json
  {
    "message": "Parcela paga com sucesso",
    "data": {
      "loan_id": "uuid",
      "payment": 91666.67,
      "remaining_months": 9,
      "new_balance": 908333.33
    }
  }
  ```
- Validações:
  - Empréstimo deve existir e estar ativo
  - Clube deve ter saldo suficiente
  - Clube deve ser o dono do empréstimo
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Saldo do clube
  - Status do empréstimo
  - Cache do clube

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

### POST `/api/club/{id}/finance/salary/process`

- Processa o pagamento mensal de salários dos jogadores
- Retorna:
  ```json
  {
    "message": "Salários processados com sucesso",
    "data": {
      "total_salaries": 1000000,
      "salary_cap": 3500000,
      "salary_cap_exceeded": false,
      "penalty_amount": 0,
      "players_processed": 25
    }
  }
  ```
- Validações:
  - Clube deve existir e pertencer ao usuário
  - Clube deve ter saldo suficiente
  - Clube deve ter jogadores
  - Jogadores emprestados não são considerados
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Saldo do clube
  - Registra despesa de salários
  - Registra multa por teto salarial (se aplicável)
  - Cache do clube

### GET `/api/club/{id}/finance/projections`

- Retorna projeções financeiras detalhadas do clube
- Inclui:
  - Orçamento atual e projeção para próxima temporada
  - Despesas e receitas por categoria
  - Projeções de receita com ingressos e sócios
  - Projeção de saldo
  - Métricas do clube (reputação, torcida, etc)
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### POST `/api/club/{id}/finance/auto-revenue`

- Calcula e registra receitas automáticas do clube
- Inclui:
  - Receita de ingressos (baseada na ocupação média)
  - Receita de sócios (baseada no número de sócios)
  - Receita de merchandising (baseada na torcida)
  - Receita de patrocínios (baseada na reputação)
- Validações:
  - Clube deve existir e pertencer ao usuário
  - Monetização deve estar habilitada no servidor
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - Saldo do clube
  - Cache do clube

### GET `/api/club/{id}/finance/report`

- Gera relatório financeiro completo do clube
- Inclui:
  - Informações do clube
  - Orçamento atual
  - Despesas e receitas detalhadas
  - Multas e empréstimos
  - Salários dos jogadores
  - Projeções financeiras
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### POST `/api/club/{id}/players/evolution`

- Processa a evolução dos jogadores do clube
- Retorna:
  ```json
  {
    "message": "Evolução dos jogadores processada com sucesso",
    "data": {
      "players_processed": 25,
      "players": [
        {
          "id": "uuid",
          "level": 5,
          "xp": 4500,
          "attributes": {
            "pace": 85,
            "shooting": 82,
            "passing": 78,
            "dribbling": 80,
            "defending": 45,
            "physical": 75
          },
          "new_value": 2500000
        }
      ]
    }
  }
  ```
- Validações:
  - Clube deve existir e pertencer ao usuário
  - Clube deve ter jogadores
  - Jogadores emprestados não são considerados
- Rate Limit: 5 requisições/minuto
- Atualiza:
  - XP e nível dos jogadores
  - Atributos baseados na posição
  - Valor de mercado
  - Cache do clube

---

## 🏆 Competições

### GET `/api/competitions/{server_id}`

- Lista todas as competições ativas do servidor

### GET `/api/competitions/{id}/standings`

- Tabela de classificação atual da competição

### GET `/api/competitions/{id}/rewards`

- Premiações por posição, artilheiro, assistências, etc

### Competições

#### POST /api/admin/competitions

Cria uma nova competição no servidor. Apenas administradores podem criar competições.

**Rate Limit:** 5 requisições por minuto

**Headers necessários:**

- `user-id`: ID do usuário administrador

**Payload:**

```json
{
  "server_id": "uuid",
  "name": "string",
  "type": "league" | "cup" | "elite",
  "season": number,
  "points_win": number, // opcional, padrão: 3
  "points_draw": number, // opcional, padrão: 1
  "tie_break_order": string[], // opcional
  "reward_schema": {
    "positions": {
      "1": number,
      "2": number,
      // ... outras posições
    },
    "top_scorer": number, // opcional
    "top_assister": number // opcional
  },
  "red_card_penalty": number, // opcional, padrão: 50000
  "club_ids": ["uuid", "uuid", ...] // mínimo 2 clubes
}
```

**Resposta de sucesso (200):**

```json
{
  "message": "Competição criada com sucesso",
  "data": {
    "competition": {
      "id": "uuid",
      "name": "string",
      "type": "string",
      "season": number,
      "club_count": number
    }
  }
}
```

**Possíveis erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `SERVER_NOT_FOUND`: Servidor não encontrado
- `INVALID_SEASON`: Temporada não corresponde à do servidor
- `CLUBS_NOT_FOUND`: Um ou mais clubes não encontrados
- `INVALID_CLUB_SERVER`: Um ou mais clubes não pertencem ao servidor
- `COMPETITION_CREATE_FAILED`: Erro ao criar competição
- `COMPETITION_CLUBS_INSERT_FAILED`: Erro ao adicionar clubes à competição

### Playoffs

#### GET /api/admin/competitions/{id}/playoffs

Lista todos os playoffs de uma competição.

**Headers necessários:**

- `user-id`: ID do administrador

**Resposta de sucesso (HTTP 200):**

```json
{
  "data": {
    "playoffs": [
      {
        "id": "uuid",
        "competition_id": "uuid",
        "season": 1,
        "status": "pending | in_progress | completed",
        "start_date": "2024-03-22T10:00:00Z",
        "end_date": "2024-03-22T10:00:00Z",
        "qualified_clubs": [
          {
            "club_id": "uuid",
            "position": 1
          }
        ],
        "bracket": {
          "rounds": [
            {
              "round": 1,
              "matches": [
                {
                  "match_number": 1
                }
              ]
            }
          ]
        },
        "matches": [
          {
            "id": "uuid",
            "round": 1,
            "match_number": 1,
            "home_club_id": "uuid",
            "away_club_id": "uuid",
            "home_goals": 2,
            "away_goals": 1,
            "status": "completed",
            "scheduled_at": "2024-03-22T10:00:00Z",
            "match_stats": {
              "possession": {
                "home": 55,
                "away": 45
              }
            },
            "home_club": {
              "id": "uuid",
              "name": "Time A",
              "logo_url": "https://exemplo.com/logo.png"
            },
            "away_club": {
              "id": "uuid",
              "name": "Time B",
              "logo_url": "https://exemplo.com/logo.png"
            }
          }
        ],
        "competition": {
          "id": "uuid",
          "name": "Liga Principal",
          "type": "league",
          "season": 1
        }
      }
    ]
  }
}
```

**Possíveis erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `PLAYOFFS_FETCH_FAILED`: Erro ao buscar playoffs
- `MATCHES_FETCH_FAILED`: Erro ao buscar partidas

**Limite de taxa:** 30 requisições por minuto

#### POST /api/admin/competitions/{id}/playoffs

Gera os playoffs para uma competição.

**Headers necessários:**

- `user-id`: ID do administrador

**Payload:**

```json
{
  "top_teams": 8 // opcional, padrão: 8
}
```

**Resposta de sucesso (HTTP 200):**

```json
{
  "message": "Playoffs gerados com sucesso",
  "data": {
    "playoff": {
      "id": "uuid",
      "competition_id": "uuid",
      "season": 1,
      "status": "pending",
      "qualified_clubs": [
        {
          "club_id": "uuid",
          "position": 1
        }
      ],
      "bracket": {
        "rounds": [
          {
            "round": 1,
            "matches": [
              {
                "match_number": 1
              }
            ]
          }
        ]
      },
      "matches": [
        {
          "id": "uuid",
          "round": 1,
          "match_number": 1,
          "home_club_id": "uuid",
          "away_club_id": "uuid",
          "status": "scheduled",
          "scheduled_at": "2024-03-22T10:00:00Z",
          "home_club": {
            "id": "uuid",
            "name": "Time A",
            "logo_url": "https://exemplo.com/logo.png"
          },
          "away_club": {
            "id": "uuid",
            "name": "Time B",
            "logo_url": "https://exemplo.com/logo.png"
          }
        }
      ],
      "competition": {
        "id": "uuid",
        "name": "Liga Principal",
        "type": "league",
        "season": 1
      }
    }
  }
}
```

**Possíveis erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `COMPETITION_NOT_FOUND`: Competição não encontrada
- `PLAYOFF_ALREADY_EXISTS`: Playoffs já existem para esta temporada
- `INVALID_DATA`: Número de times inválido
- `PLAYOFF_GENERATION_FAILED`: Erro ao gerar playoffs
- `PLAYOFF_FETCH_FAILED`: Erro ao buscar playoffs
- `MATCHES_FETCH_FAILED`: Erro ao buscar partidas

**Limite de taxa:** 5 requisições por minuto

#### POST /api/admin/playoffs/matches/{id}/score

Registra o resultado de uma partida dos playoffs.

**Headers necessários:**

- `user-id`: ID do administrador

**Payload:**

```json
{
  "home_goals": 2,
  "away_goals": 1,
  "match_stats": {
    "possession": {
      "home": 55,
      "away": 45
    },
    "shots": {
      "home": 12,
      "away": 8
    },
    "shots_on_target": {
      "home": 5,
      "away": 3
    },
    "corners": {
      "home": 6,
      "away": 4
    },
    "fouls": {
      "home": 8,
      "away": 10
    }
  }
}
```

**Resposta de sucesso (HTTP 200):**

```json
{
  "message": "Resultado processado com sucesso",
  "data": {
    "match_id": "uuid",
    "home_goals": 2,
    "away_goals": 1,
    "match_stats": {
      // Estatísticas da partida
    }
  }
}
```

**Possíveis erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `MATCH_NOT_FOUND`: Partida não encontrada
- `MATCH_ALREADY_COMPLETED`: Partida já está concluída
- `INVALID_DATA`: Placar inválido
- `MATCH_PROCESSING_FAILED`: Erro ao processar resultado

**Limite de taxa:** 5 requisições por minuto

**Atualizações:**

- Status da partida
- Gols marcados e sofridos
- Estatísticas da partida
- Próxima partida do bracket (se aplicável)
- Status dos playoffs (se for a final)
- Cache da partida e dos playoffs

### Divisões

#### Listar Divisões

**GET /api/admin/divisions**

Lista todas as divisões de um servidor.

**Headers:**

- `user-id`: ID do usuário administrador
- `server-id`: ID do servidor

**Query Parameters:**

- `season`: Temporada (opcional)

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "divisions": [
      {
        "id": "uuid",
        "server_id": "uuid",
        "name": "string",
        "level": "integer",
        "promotion_spots": "integer",
        "relegation_spots": "integer",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
  }
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `SERVER_NOT_FOUND`: Servidor não encontrado

### Criar Divisão

**POST /api/admin/divisions**

Cria uma nova divisão.

**Headers:**

- `user-id`: ID do usuário administrador
- `server-id`: ID do servidor

**Payload:**

```json
{
  "name": "string",
  "level": "integer",
  "promotion_spots": "integer",
  "relegation_spots": "integer"
}
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "division": {
      "id": "uuid",
      "server_id": "uuid",
      "name": "string",
      "level": "integer",
      "promotion_spots": "integer",
      "relegation_spots": "integer",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `SERVER_NOT_FOUND`: Servidor não encontrado
- `INVALID_LEVEL`: Nível de divisão inválido
- `DIVISION_CREATE_FAILED`: Falha ao criar divisão

### Processar Promoções e Rebaixamentos

**POST /api/admin/divisions/process**

Processa as promoções e rebaixamentos entre divisões.

**Headers:**

- `user-id`: ID do usuário administrador

**Payload:**

```json
{
  "server_id": "uuid"
}
```

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "promotions": [
      {
        "club_id": "uuid",
        "from_division_id": "uuid",
        "to_division_id": "uuid",
        "type": "string"
      }
    ],
    "relegations": [
      {
        "club_id": "uuid",
        "from_division_id": "uuid",
        "to_division_id": "uuid",
        "type": "string"
      }
    ]
  }
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `SERVER_NOT_FOUND`: Servidor não encontrado
- `PROCESS_FAILED`: Falha ao processar promoções/rebaixamentos

### Histórico de Promoções e Rebaixamentos

**GET /api/admin/divisions/history**

Retorna o histórico de promoções e rebaixamentos.

**Headers:**

- `user-id`: ID do usuário administrador
- `server-id`: ID do servidor

**Query Parameters:**

- `season`: Temporada (opcional)
- `club_id`: ID do clube (opcional)
- `type`: Tipo do movimento ('promotion' ou 'relegation') (opcional)

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "uuid",
        "server_id": "uuid",
        "club_id": "uuid",
        "season": "integer",
        "from_division_id": "uuid",
        "to_division_id": "uuid",
        "type": "string",
        "created_at": "timestamp"
      }
    ]
  }
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `SERVER_NOT_FOUND`: Servidor não encontrado

### Distribuir Premiações

`POST /api/admin/competitions/:id/rewards`

Distribui as premiações para os clubes e jogadores de uma competição finalizada.

#### Headers

| Nome    | Tipo   | Descrição           |
| ------- | ------ | ------------------- |
| user-id | string | ID do usuário admin |

#### Resposta de Sucesso

```json
{
  "success": true
}
```

#### Possíveis Erros

- `UNAUTHORIZED`: Usuário não autenticado ou não é admin
- `COMPETITION_NOT_FOUND`: Competição não encontrada
- `COMPETITION_NOT_COMPLETED`: A competição precisa estar finalizada
- `REWARDS_ALREADY_PROCESSED`: As premiações já foram processadas
- `SERVER_ERROR`: Erro interno do servidor

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

### GET `/api/admin/players/global/{id}`

- Retorna detalhes de um jogador global específico
- Retorna:
  ```json
  {
    "data": {
      "player": {
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
    }
  }
  ```
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### POST `/api/admin/players/import`

- Importa jogadores de um arquivo CSV para a base global
- Payload:
  - Formato multipart/form-data
  - Campo `file`: Arquivo CSV com os jogadores
- Formato do CSV:
  ```
  name,age,nationality,position,overall,potential,pace,shooting,passing,dribbling,defending,physical,base_salary,base_value
  Neymar Jr,31,Brasil,ATT,89,89,85,88,85,93,36,63,1200000,80000000
  ```
- Retorna:
  ```json
  {
    "message": "Jogadores importados com sucesso",
    "data": {
      "imported_count": "number"
    }
  }
  ```
- Validações:
  - Arquivo deve ser CSV
  - Campos obrigatórios: name, age, nationality, position, overall, potential
  - Valores numéricos devem ser válidos
  - Posição deve ser uma das seguintes: GK, DEF, MID, ATT
- Rate Limit: 5 requisições/minuto

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

### GET `/api/admin/players/server/{server_id}/{id}`

- Retorna detalhes de um jogador específico de um servidor
- Retorna:
  ```json
  {
    "data": {
      "player": {
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
    }
  }
  ```
- Rate Limit: 30 requisições/minuto
- Cache: 5 minutos

### POST `/api/admin/players/server/{server_id}/create`

- Cria um novo jogador em um servidor específico
- Payload:
  ```json
  {
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
    "club_id": "uuid",
    "is_star_player": "boolean"
  }
  ```
- Retorna:
  ```json
  {
    "message": "Jogador criado com sucesso",
    "data": {
      "player": {
        "id": "uuid",
        "name": "string",
        "position": "string",
        "overall": "number",
        "club_id": "uuid"
      }
    }
  }
  ```
- Validações:
  - Campos obrigatórios: name, age, nationality, position, overall, potential
  - Valores numéricos devem ser válidos
  - Posição deve ser uma das seguintes: GK, DEF, MID, ATT
  - Clube deve existir no servidor
- Rate Limit: 5 requisições/minuto

### PUT `/api/admin/players/server/{server_id}/{id}`

- Atualiza um jogador existente em um servidor
- Payload:
  ```json
  {
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
    "club_id": "uuid",
    "is_star_player": "boolean"
  }
  ```
- Retorna:
  ```json
  {
    "message": "Jogador atualizado com sucesso",
    "data": {
      "player": {
        "id": "uuid",
        "name": "string",
        "position": "string",
        "overall": "number",
        "club_id": "uuid"
      }
    }
  }
  ```
- Validações:
  - Jogador deve existir no servidor
  - Campos obrigatórios: name, age, nationality, position, overall, potential
  - Valores numéricos devem ser válidos
  - Posição deve ser uma das seguintes: GK, DEF, MID, ATT
  - Clube deve existir no servidor
- Rate Limit: 5 requisições/minuto

### DELETE `/api/admin/players/server/{server_id}/{id}`

- Remove um jogador de um servidor
- Retorna:
  ```json
  {
    "message": "Jogador removido com sucesso"
  }
  ```
- Validações:
  - Jogador deve existir no servidor
  - Jogador não pode estar vinculado a um clube
- Rate Limit: 5 requisições/minuto

## Gerenciamento de Partidas

### Listar Partidas

`GET /api/admin/matches`

Lista todas as partidas do servidor, com opções de filtro.

**Headers:**

- `user-id`: ID do usuário administrador

**Query Parameters:**

- `competition_id` (opcional): Filtrar por competição
- `status` (opcional): Filtrar por status (scheduled, in_progress, completed, cancelled)
- `round` (opcional): Filtrar por rodada

**Resposta de Sucesso (200):**

```json
{
  "data": {
    "matches": [
      {
        "id": "string",
        "competition_id": "string",
        "home_club_id": "string",
        "away_club_id": "string",
        "scheduled_at": "string",
        "status": "string",
        "home_goals": "number",
        "away_goals": "number",
        "round": "number",
        "competition": {
          "id": "string",
          "name": "string",
          "type": "string",
          "season": "number"
        },
        "home_club": {
          "id": "string",
          "name": "string",
          "logo_url": "string",
          "city": "string",
          "country": "string"
        },
        "away_club": {
          "id": "string",
          "name": "string",
          "logo_url": "string",
          "city": "string",
          "country": "string"
        }
      }
    ]
  }
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador

### Obter Detalhes da Partida

`GET /api/admin/matches/{id}`

Obtém os detalhes completos de uma partida específica.

**Headers:**

- `user-id`: ID do usuário administrador

**Resposta de Sucesso (200):**

```json
{
  "data": {
    "match": {
      "id": "string",
      "competition_id": "string",
      "home_club_id": "string",
      "away_club_id": "string",
      "scheduled_at": "string",
      "status": "string",
      "home_goals": "number",
      "away_goals": "number",
      "round": "number",
      "home_formation": "string",
      "away_formation": "string",
      "home_lineup": "object",
      "away_lineup": "object",
      "match_stats": "object",
      "highlights": "array",
      "events": "array",
      "competition": {
        "id": "string",
        "name": "string",
        "type": "string",
        "season": "number",
        "server_id": "string"
      },
      "home_club": {
        "id": "string",
        "name": "string",
        "logo_url": "string",
        "city": "string",
        "country": "string"
      },
      "away_club": {
        "id": "string",
        "name": "string",
        "logo_url": "string",
        "city": "string",
        "country": "string"
      }
    }
  }
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `MATCH_NOT_FOUND`: Partida não encontrada

### Atualizar Partida

`PUT /api/admin/matches/{id}`

Atualiza os detalhes de uma partida específica.

**Headers:**

- `user-id`: ID do usuário administrador

**Payload:**

```json
{
  "status": "string", // scheduled, in_progress, completed, cancelled
  "home_goals": "number",
  "away_goals": "number",
  "home_formation": "string",
  "away_formation": "string",
  "home_lineup": "object",
  "away_lineup": "object",
  "match_stats": "object",
  "highlights": "array",
  "events": "array"
}
```

**Resposta de Sucesso (200):**

```json
{
  "message": "Partida atualizada com sucesso",
  "data": {
    "match": {
      // Dados atualizados da partida
    }
  }
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `MATCH_NOT_FOUND`: Partida não encontrada
- `MATCH_UPDATE_FAILED`: Erro ao atualizar partida
- `INVALID_DATA`: Dados inválidos no payload

### Excluir Partida

`DELETE /api/admin/matches/{id}`

Exclui uma partida específica. Não é possível excluir partidas já concluídas.

**Headers:**

- `user-id`: ID do usuário administrador

**Resposta de Sucesso (200):**

```json
{
  "message": "Partida excluída com sucesso"
}
```

**Possíveis Erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `MATCH_NOT_FOUND`: Partida não encontrada
- `MATCH_ALREADY_COMPLETED`: Não é possível excluir uma partida já concluída
- `MATCH_DELETE_FAILED`: Erro ao excluir partida

### Pontuação de Partidas

#### POST /api/admin/matches/{id}/score

Registra a pontuação de uma partida e atualiza a classificação da competição.

**Headers necessários:**

- `user-id`: ID do administrador

**Payload:**

```json
{
  "home_goals": 2,
  "away_goals": 1,
  "match_stats": {
    "possession": {
      "home": 55,
      "away": 45
    },
    "shots": {
      "home": 12,
      "away": 8
    },
    "shots_on_target": {
      "home": 5,
      "away": 3
    },
    "corners": {
      "home": 6,
      "away": 4
    },
    "fouls": {
      "home": 8,
      "away": 10
    }
  }
}
```

**Resposta de sucesso (HTTP 200):**

```json
{
  "message": "Pontuação registrada com sucesso",
  "data": {
    "match_id": "uuid",
    "home_goals": 2,
    "away_goals": 1,
    "home_points": 3,
    "away_points": 0,
    "match_stats": {
      // Estatísticas da partida
    }
  }
}
```

**Possíveis erros:**

- `UNAUTHORIZED`: Usuário não autenticado
- `FORBIDDEN`: Usuário não é administrador
- `MATCH_NOT_FOUND`: Partida não encontrada
- `MATCH_ALREADY_COMPLETED`: Partida já está concluída
- `INVALID_GOALS`: Número de gols inválido
- `SCORE_PROCESSING_FAILED`: Erro ao processar pontuação

**Limite de taxa:** 5 requisições por minuto

**Atualizações:**

- Status da partida
- Gols marcados e sofridos
- Estatísticas da partida
- Pontos na classificação
- Vitórias, empates e derrotas
- Gols marcados e sofridos na classificação
- Cache da partida e da classificação
